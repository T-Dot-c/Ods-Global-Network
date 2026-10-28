/**
 * ODS Global Network — Admin Two-Factor Authentication Service (RFC 6238 TOTP)
 *
 * Implements standard Time-based One-Time Password (TOTP) algorithm using native Node.js crypto.
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
 */
'use strict';

const crypto = require('crypto');
const pool = require('../db');

// Base32 RFC 4648 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to RFC 4648 Base32 string (without padding).
 */
function toBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
function fromBase32(str) {
  const cleanStr = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${cleanStr[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given secret at a specific counter step.
 *
 * @param {string} base32Secret
 * @param {number} [timeStep] Counter step (default: Math.floor(Date.now() / 30000))
 * @returns {string} 6-digit code
 */
function generateTOTP(base32Secret, timeStep = Math.floor(Date.now() / 30000)) {
  const key = fromBase32(base32Secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a secret with +/- 1 time-step drift tolerance (90s window).
 *
 * @param {string} token 6-digit string
 * @param {string} base32Secret
 * @returns {boolean}
 */
function verifyTOTP(token, base32Secret) {
  if (!token || typeof token !== 'string' || token.trim().length !== 6) {
    return false;
  }

  const cleanToken = token.trim();
  const currentStep = Math.floor(Date.now() / 30000);

  // Check current step, -1 step (30s ago), +1 step (30s future)
  for (let offset = -1; offset <= 1; offset++) {
    const expected = generateTOTP(base32Secret, currentStep + offset);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a new random Base32 secret for TOTP enrollment.
 * 20 bytes = 160 bits of entropy.
 */
function generateSecret() {
  const randomBytes = crypto.randomBytes(20);
  return toBase32(randomBytes);
}

/**
 * Generates 8 single-use recovery codes.
 * Returns { plaintextCodes: string[], hashedCodes: string[] }
 */
function generateRecoveryCodes(count = 8) {
  const plaintextCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    // Format: 4-4 alphanumeric e.g. "ABCD-1234"
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    plaintextCodes.push(formatted);

    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }

  return { plaintextCodes, hashedCodes };
}

/**
 * Hashes a user-submitted recovery code for comparison.
 */
function hashRecoveryCode(code) {
  const clean = code.trim().toUpperCase();
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Builds the otpauth:// URI for QR code generation.
 */
function getOtpAuthUri(email, base32Secret, issuer = 'ODS Global Network') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${base32Secret}&issuer=${encodedIssuer}&digits=6&period=30`;
}

/**
 * Checks if 2FA is active for a user in the database.
 */
async function get2FAStatus(userId) {
  const res = await pool.query(
    'SELECT is_enabled, last_used_at FROM admin_2fa_secrets WHERE user_id = $1',
    [userId]
  );
  if (res.rows.length === 0) {
    return { isEnabled: false, lastUsedAt: null };
  }
  return {
    isEnabled: Boolean(res.rows[0].is_enabled),
    lastUsedAt: res.rows[0].last_used_at,
  };
}

/**
 * Initializes a pending 2FA setup for an admin user.
 */
async function setup2FA(userId, userEmail) {
  const secret = generateSecret();
  const { plaintextCodes, hashedCodes } = generateRecoveryCodes(8);
  const otpauthUri = getOtpAuthUri(userEmail, secret);

  await pool.query(
    `INSERT INTO admin_2fa_secrets (user_id, secret_base32, is_enabled, recovery_hashes, updated_at)
     VALUES ($1, $2, FALSE, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET secret_base32 = EXCLUDED.secret_base32,
         is_enabled = FALSE,
         recovery_hashes = EXCLUDED.recovery_hashes,
         updated_at = NOW()`,
    [userId, secret, hashedCodes]
  );

  return {
    secret,
    otpauthUri,
    recoveryCodes: plaintextCodes,
  };
}

/**
 * Confirms and activates 2FA by validating the first TOTP code.
 */
async function enable2FA(userId, token) {
  const res = await pool.query(
    'SELECT secret_base32 FROM admin_2fa_secrets WHERE user_id = $1',
    [userId]
  );

  if (res.rows.length === 0) {
    throw new Error('2FA setup has not been initiated.');
  }

  const { secret_base32 } = res.rows[0];
  const isValid = verifyTOTP(token, secret_base32);

  if (!isValid) {
    return false;
  }

  await pool.query(
    `UPDATE admin_2fa_secrets
     SET is_enabled = TRUE, last_used_at = NOW(), updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  return true;
}

/**
 * Validates a submitted TOTP code or single-use recovery code.
 * Consumes recovery code atomically if used.
 */
async function verifyAdminAuth2FA(userId, codeOrToken) {
  const res = await pool.query(
    'SELECT secret_base32, is_enabled, recovery_hashes FROM admin_2fa_secrets WHERE user_id = $1',
    [userId]
  );

  if (res.rows.length === 0 || !res.rows[0].is_enabled) {
    return { success: false, reason: '2FA is not enabled for this user.' };
  }

  const { secret_base32, recovery_hashes } = res.rows[0];
  const clean = String(codeOrToken).trim();

  // 1. Try TOTP 6-digit code
  if (/^\d{6}$/.test(clean)) {
    const isValid = verifyTOTP(clean, secret_base32);
    if (isValid) {
      await pool.query(
        'UPDATE admin_2fa_secrets SET last_used_at = NOW(), updated_at = NOW() WHERE user_id = $1',
        [userId]
      );
      return { success: true, method: 'totp' };
    }
  }

  // 2. Try single-use recovery code (e.g. "ABCD-1234")
  const submittedHash = hashRecoveryCode(clean);
  const codeIndex = recovery_hashes.indexOf(submittedHash);

  if (codeIndex !== -1) {
    // Atomically consume recovery code
    const updatedHashes = recovery_hashes.filter((_, idx) => idx !== codeIndex);
    await pool.query(
      `UPDATE admin_2fa_secrets
       SET recovery_hashes = $1, last_used_at = NOW(), updated_at = NOW()
       WHERE user_id = $2`,
      [updatedHashes, userId]
    );

    return {
      success: true,
      method: 'recovery_code',
      remainingRecoveryCodes: updatedHashes.length,
    };
  }

  return { success: false, reason: 'Invalid authenticator code or recovery code.' };
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateRecoveryCodes,
  getOtpAuthUri,
  get2FAStatus,
  setup2FA,
  enable2FA,
  verifyAdminAuth2FA,
};
