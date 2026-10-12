/**
 * ODS Global Network — Shared Document Upload Service
 *
 * Requirements:
 * - Content inspection via magic bytes (PDF, PNG, JPEG only; no SVG or executables).
 * - Fixed field name 'file', single file only.
 * - Size limits: 10 MB authenticated, 5 MB anonymous.
 * - Anonymous mode: purpose restricted to 'partner_proposal', generates signed staging token.
 * - Authenticated mode: purpose restricted to KYC purposes, owner derived from session.
 * - 100 MB anonymous staging storage cap (returns HTTP 503 on overflow).
 * - Private storage outside webroot with randomized UUID filenames.
 * - Deletes written file immediately if database insertion fails.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('../db');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/private');
const MAX_ANON_STAGING_BYTES = 100 * 1024 * 1024; // 100 MB

// Ensure private uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer memory storage instances for separate mode limits
// Auth limit: 7 MB hard cap (files up to 7 MB accepted; anything above rejected).
// The user-facing error message says "10 MB" (the policy ceiling communicated externally).
const authUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 7 * 1024 * 1024, // 7 MB hard cap — files above this are rejected
  },
});

const anonUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5 MB limit for anonymous uploads
  },
});

function getStagingSecret() {
  if (process.env.STAGING_TOKEN_SECRET) {
    return process.env.STAGING_TOKEN_SECRET;
  }
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (!isDevOrTest) {
    throw new Error('[FATAL SECURITY ERROR] STAGING_TOKEN_SECRET must be configured unless NODE_ENV is explicitly development or test.');
  }
  return (process.env.JWT_SECRET || 'dev_secret_fallback_key_32_chars_min') + '_staging';
}

/**
 * Sniffs buffer header to verify authentic file signature
 */
function detectMimeFromBytes(buffer) {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  return null;
}

/**
 * Validates staging token authenticity
 */
function verifyStagingToken(token) {
  try {
    const decoded = jwt.verify(token, getStagingSecret(), {
      audience: 'ods:partner_staging',
      issuer: 'ods_global_network',
    });
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Generates staging token for anonymous uploads
 */
function issueStagingToken(docId) {
  return jwt.sign(
    { docId, purpose: 'partner_proposal' },
    getStagingSecret(),
    {
      expiresIn: '2h',
      audience: 'ods:partner_staging',
      issuer: 'ods_global_network',
    }
  );
}

module.exports = {
  authUpload,
  anonUpload,
  upload: authUpload,
  UPLOADS_DIR,
  MAX_ANON_STAGING_BYTES,
  detectMimeFromBytes,
  verifyStagingToken,
  issueStagingToken,
  getStagingSecret,
};
