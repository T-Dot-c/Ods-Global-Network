/**
 * ODS Global Network — Transactional Email Service
 *
 * Dispatches verification, password recovery, and security notice emails.
 * Uses Nodemailer configured for Mailpit (dev) or secure SMTP (production).
 * Zero secret logging; non-blocking delivery tolerance; header injection guards.
 */
'use strict';

const nodemailer = require('nodemailer');

const NODE_ENV = process.env.NODE_ENV;

// Outside development, strict SMTP credentials are required at startup
if (NODE_ENV !== 'development') {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(`[FATAL] SMTP configuration is strictly required when NODE_ENV is not 'development' (current NODE_ENV="${NODE_ENV || 'unset'}").`);
  }
}

/**
 * Returns a normalized origin from FRONTEND_ORIGIN, falling back safely in dev.
 */
function getNormalizedOrigin() {
  const originStr = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  try {
    return new URL(originStr).origin;
  } catch {
    return 'http://localhost:5173';
  }
}

/**
 * Strips CR (\r) and LF (\n) to prevent email header injection attacks.
 */
function sanitizeHeader(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]/g, ' ').trim();
}

/**
 * Creates Nodemailer transporter configured strictly without logger or debug flags.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || '127.0.0.1';
  const port = parseInt(process.env.SMTP_PORT || '1025', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const config = {
    host,
    port,
    secure,
    // Strictly disable nodemailer debug output to prevent credential or token leaks
    logger: false,
    debug: false,
  };

  if (user && pass) {
    config.auth = { user, pass };
  }

  return nodemailer.createTransport(config);
}

const transporter = createTransporter();

/**
 * Low-level dispatch helper catching all errors and returning sanitized result.
 * Never throws into caller.
 */
async function dispatchMail({ to, subject, html, text }) {
  const from = sanitizeHeader(process.env.SMTP_FROM || 'ODS Global Network <no-reply@ods-global.net>');
  const safeSubject = sanitizeHeader(subject);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: safeSubject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Zero secret logging: log only sanitized error code
    const sanitizedCode = err && (err.originalCode || err.code || err.syscall || 'MAIL_DELIVERY_FAILED');
    console.error(`[MAIL] Delivery failed: ${sanitizedCode}`);
    return { success: false, error: sanitizedCode };
  }
}

/**
 * Dispatches an email verification link with URL fragment (#token=...).
 */
async function sendVerificationEmail({ to, token }) {
  const origin = getNormalizedOrigin();
  const verifyUrl = `${origin}/verify-email#token=${token}`;

  const subject = 'Verify your ODS Global Network account';
  const text = `Welcome to ODS Global Network.\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nThis link will expire in 24 hours.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0b1f3a;">Verify Your Account</h2>
      <p>Thank you for registering with ODS Global Network. Please verify your email address to activate all account features.</p>
      <div style="margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours. If you did not create this account, please disregard this email.</p>
    </div>
  `;

  return dispatchMail({ to, subject, html, text });
}

/**
 * Dispatches a password reset link with URL fragment (#token=...).
 */
async function sendPasswordResetEmail({ to, token }) {
  const origin = getNormalizedOrigin();
  const resetUrl = `${origin}/reset-password#token=${token}`;

  const subject = 'Reset your ODS Global Network password';
  const text = `A password reset request was received for your ODS Global Network account.\n\nReset your password here:\n${resetUrl}\n\nThis link will expire in 15 minutes. If you did not request a password reset, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0b1f3a;">Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes. If you did not request this change, you can safely ignore this message.</p>
    </div>
  `;

  return dispatchMail({ to, subject, html, text });
}

/**
 * Dispatches a security notice confirming password was updated.
 */
async function sendPasswordChangedAlert({ to, email }) {
  const recipient = to || email;
  const subject = 'Your ODS Global Network password was changed';
  const text = `Your ODS Global Network password was recently changed.\n\nAll other active sessions have been invalidated.\n\nIf you did not perform this change, please contact security immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0b1f3a;">Security Alert: Password Changed</h2>
      <p>Your password was recently changed successfully. As a security precaution, all existing sessions on other devices have been invalidated.</p>
      <p style="color: #b91c1c; font-weight: bold;">If you did not make this change, please contact ODS support immediately.</p>
    </div>
  `;

  return dispatchMail({ to: recipient, subject, html, text });
}

/**
 * Dispatches a security alert on duplicate registration attempt.
 */
async function sendDuplicateRegistrationAlert({ to, email }) {
  const recipient = to || email;
  const subject = 'Registration attempt for existing account';
  const text = `A new registration was attempted using your email address.\n\nIf this was you, you can log in or reset your password. If you did not attempt this, no action is needed as your existing account remains secure.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0b1f3a;">Registration Attempt Notice</h2>
      <p>A registration was recently attempted with your email address on ODS Global Network.</p>
      <p>Since you already have an account, no new account was created. If you forgot your password, you can use the account recovery option.</p>
      <p style="color: #64748b; font-size: 14px;">If this was not you, someone may have mistakenly entered your email address. Your account remains secure.</p>
    </div>
  `;

  return dispatchMail({ to: recipient, subject, html, text });
}

/**
 * Dispatches an itemized payment receipt confirmation email.
 */
async function sendPaymentReceiptEmail({ to, email, fullName, txRef, amount, currency = 'ETB', purpose = 'Payment', date = new Date() }) {
  const recipient = to || email;
  const subject = `Payment Receipt - ${txRef}`;
  const formattedDate = new Date(date).toUTCString();
  const text = `ODS Global Network — Payment Receipt\n\nDear ${fullName || 'Valued Customer'},\n\nYour payment has been successfully processed.\n\nTransaction Reference: ${txRef}\nAmount: ${amount} ${currency}\nPurpose: ${purpose}\nDate: ${formattedDate}\n\nThank you for choosing ODS Global Network.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F285B; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">ODS Global Network</h1>
        <p style="color: #BE9B49; margin: 4px 0 0 0; font-size: 13px;">Official Payment Receipt</p>
      </div>
      <p style="color: #334155; font-size: 15px;">Dear <strong>${fullName || 'Valued Customer'}</strong>,</p>
      <p style="color: #334155; font-size: 14px;">Your payment has been successfully received and verified. Below are your transaction details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Transaction Ref:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0F285B;">${txRef}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #047857; font-size: 16px;">${amount} ${currency}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Purpose:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">${purpose}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Date & Time:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Status:</td>
          <td style="padding: 8px 0; text-align: right; color: #047857; font-weight: bold;">Completed</td>
        </tr>
      </table>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        You can review your full transaction history anytime in your Customer Portal.<br />
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;

  return dispatchMail({ to: recipient, subject, html, text });
}

/**
 * Dispatches a luxury gift card presentation email to the recipient.
 */
async function sendGiftCardPresentationEmail({
  to,
  recipientName,
  senderName,
  code,
  amount,
  currency = 'ETB',
  giftType = 'monetary',
  packageType = 'basic',
  occasion = 'Generic',
  serviceTitle,
  personalMessage,
  expiryDate,
}) {
  const origin = getNormalizedOrigin();
  const claimUrl = `${origin}/dashboard/customer?tab=gifting&claim=${encodeURIComponent(code)}`;
  const isVip = packageType === 'vip';
  const recipient = sanitizeHeader(to);

  const occasionBadge = occasion ? occasion.toUpperCase() : 'GIFT';
  const subject = senderName
    ? `🎁 ${senderName} sent you an ODS Global Network Gift Card!`
    : `🎁 You have received an ODS Global Network Gift Card!`;

  const headerGradient = isVip
    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    : 'linear-gradient(135deg, #0F285B 0%, #1e3a8a 100%)';
  const accentBorder = isVip ? '#d97706' : '#10b981';

  const text = `
You received an ODS Global Network Gift Card!
Occasion: ${occasion}
${senderName ? `From: ${senderName}\n` : ''}
${personalMessage ? `Personal Message: "${personalMessage}"\n` : ''}
${giftType === 'service' ? `Service: ${serviceTitle || 'Healthcare Service'}` : `Value: ${amount} ${currency}`}
Claim Code: ${code}
Expiry: ${expiryDate ? new Date(expiryDate).toLocaleDateString() : '12 months'}

Claim your gift card here: ${claimUrl}
  `.trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: ${headerGradient}; padding: 28px 24px; border-radius: 8px; text-align: center; border-bottom: 4px solid ${accentBorder};">
        <span style="display: inline-block; background: rgba(255, 255, 255, 0.15); color: #fbbf24; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
          ${isVip ? '★ VIP LUXURY VOUCHER ★' : 'DIGITAL GIFT CARD'}
        </span>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
          ODS Global Network
        </h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
          ${occasionBadge} EDITION
        </p>
      </div>

      <div style="padding: 24px 8px;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 12px 0;">
          Dear <strong>${recipientName || 'Friend'}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ${senderName ? `<strong>${senderName}</strong> has sent you a special gift card via ODS Global Network.` : 'You have received a special gift card via ODS Global Network.'}
        </p>

        ${personalMessage ? `
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 4px; margin: 16px 0 24px 0; font-style: italic; color: #334155; font-size: 14px;">
            "${personalMessage}"
          </div>
        ` : ''}

        <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">
            ${giftType === 'service' ? 'Dedicated Service Gift' : 'Gift Value'}
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #0F285B; margin-bottom: 14px;">
            ${giftType === 'service' ? (serviceTitle || 'Healthcare Package') : `${amount} ${currency}`}
          </div>

          <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">YOUR DIGITAL CLAIM CODE</div>
          <div style="display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #0f172a;">
            ${code}
          </div>
          ${expiryDate ? `
            <div style="font-size: 11px; color: #94a3b8; margin-top: 10px;">
              Valid until: ${new Date(expiryDate).toLocaleDateString()}
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${claimUrl}" style="background: #0F285B; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(15, 40, 91, 0.2);">
            Redeem into Digital Wallet →
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        ODS Global Network — Secure Digital Health & Wellness Vouchers<br />
        This is an automated gift card delivery notification.
      </div>
    </div>
  `;

  return dispatchMail({ to: recipient, subject, html, text });
}

/**
 * Dispatches an email notification to the sender when their gift card is claimed.
 */
async function sendGiftCardRedemptionNoticeEmail({
  to,
  senderName,
  recipientName,
  amount,
  currency = 'ETB',
  occasion,
  code,
}) {
  const recipient = sanitizeHeader(to);
  const subject = `🎉 Your ODS Global Network Gift Card was redeemed!`;

  const text = `
Great news! The gift card you sent (${amount} ${currency}, ${occasion || 'Gift'}) has been redeemed.
Recipient: ${recipientName || 'Your recipient'}
Claim Code: ${code}

Thank you for choosing ODS Global Network.
  `.trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 24px; border-radius: 8px; text-align: center;">
        <span style="font-size: 32px;">🎉</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 20px; font-weight: 800;">
          Your Gift Has Been Redeemed!
        </h2>
      </div>

      <div style="padding: 24px 8px;">
        <p style="color: #334155; font-size: 15px;">
          Dear <strong>${senderName || 'Valued Customer'}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We're pleased to inform you that the gift card you shared has just been claimed and credited to <strong>${recipientName || 'the recipient'}</strong>'s digital wallet.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Amount:</span>
            <strong style="color: #047857;">${amount} ${currency}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Occasion:</span>
            <strong style="color: #334155;">${occasion || 'Generic'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Status:</span>
            <span style="color: #047857; font-weight: bold;">Redeemed</span>
          </div>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Thank you for spreading care and wellness through the ODS Global Network.
        </p>
      </div>
    </div>
  `;

  return dispatchMail({ to: recipient, subject, html, text });
}

module.exports = {
  createTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedAlert,
  sendPasswordChangedNotice: sendPasswordChangedAlert,
  sendDuplicateRegistrationAlert,
  sendPaymentReceiptEmail,
  sendGiftCardPresentationEmail,
  sendGiftCardRedemptionNoticeEmail,
  // Exported for testing / internal helpers
  dispatchMail,
  sanitizeHeader,
  getNormalizedOrigin,
};

