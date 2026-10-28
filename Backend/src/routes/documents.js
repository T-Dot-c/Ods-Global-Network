/**
 * ODS Global Network — Shared Document Routes
 *
 * Endpoints:
 * - POST /api/documents/upload: Unified upload endpoint (Authenticated & Anonymous)
 * - GET /api/documents/:id/view: Authorized document streaming endpoint
 */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { requireAuth, isVerifiedOrExempt } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');
const { notify } = require('../services/notificationService');
const {
  authUpload,
  anonUpload,
  UPLOADS_DIR,
  MAX_ANON_STAGING_BYTES,
  detectMimeFromBytes,
  issueStagingToken,
} = require('../services/uploadService');

const router = express.Router();

/* ── Rate Limiters ───────────────────────────────────────────── */
const anonUploadLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_ANON_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_ANON_WINDOW_MS, 10)
    : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_ANON_MAX
    ? parseInt(process.env.RATE_LIMIT_ANON_MAX, 10)
    : 10,
  message: { success: false, message: 'Too many upload attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Helper: Optional Auth Extractor for Upload ──────────────── */
const { resolveSession } = require('../services/sessionService');

async function extractOptionalAuth(req) {
  const token = req.cookies?.ods_session || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return null;
  try {
    const user = await resolveSession(token);
    return user;
  } catch (err) {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/documents/upload
   Unified upload handler for Authenticated & Anonymous modes
   ───────────────────────────────────────────────────────────── */
router.post('/upload', async (req, res, next) => {
  // If not authenticated, apply strict rate limiting
  const user = await extractOptionalAuth(req);
  const isAuthenticated = !!user;
  req.resolvedUser = user;
  if (!isAuthenticated) {
    return anonUploadLimiter(req, res, () => {
      uploadMiddleware(req, res, next, false);
    });
  }

  // Gating per Batch 5 spec: require verified email on authenticated KYC upload
  if (!isVerifiedOrExempt(user)) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to upload KYC documents.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
    });
  }

  return uploadMiddleware(req, res, next, true);
});

function uploadMiddleware(req, res, next, isAuthMode) {
  const uploader = isAuthMode ? authUpload : anonUpload;
  uploader.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        // Auth external policy: report "10 MB" even though the hard cap is 7 MB.
        const limitMsg = isAuthMode
          ? 'File exceeds maximum size of 10 MB.'
          : 'File exceeds maximum size of 5 MB.';
        return res.status(400).json({ success: false, message: limitMsg });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Expected field name: "file".' });
    }

    const authUser = req.resolvedUser;
    const isAuthenticated = !!authUser;
    const purpose = req.body.purpose ? String(req.body.purpose).trim().toLowerCase() : '';

    // 1. Validate Purpose
    const VALID_KYC_PURPOSES = ['kyc_license', 'kyc_registration', 'kyc_accreditation'];
    if (isAuthenticated) {
      if (!VALID_KYC_PURPOSES.includes(purpose)) {
        return res.status(400).json({
          success: false,
          message: `Invalid purpose for authenticated upload. Allowed: ${VALID_KYC_PURPOSES.join(', ')}`,
        });
      }
    } else {
      if (purpose !== 'partner_proposal') {
        return res.status(400).json({
          success: false,
          message: 'Invalid purpose for anonymous upload. Allowed: "partner_proposal".',
        });
      }
    }

    // 2. Validate Size Bounds (secondary guard; multer already enforces the hard cap)
    // Auth: 7 MB hard cap; anonymous: 5 MB hard cap.
    // Error message always shows "10 MB" / "5 MB" per external policy.
    const maxBytes = isAuthenticated ? 7 * 1024 * 1024 : 5 * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return res.status(400).json({
        success: false,
        message: `File exceeds maximum size of ${isAuthenticated ? '10 MB' : '5 MB'}.`,
      });
    }

    // 3. Inspect Magic Bytes
    const detected = detectMimeFromBytes(req.file.buffer);
    if (!detected) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only authentic PDF, PNG, and JPEG documents are permitted.',
      });
    }

    const client = await pool.connect();
    let writtenFilePath = null;

    try {
      // 4. Anonymous Storage Cap Check (100 MB max staged storage)
      if (!isAuthenticated) {
        const quotaRes = await client.query(`
          SELECT COALESCE(SUM(file_size), 0) AS total_staged
          FROM documents
          WHERE is_attached = FALSE AND expires_at > NOW()
        `);
        const totalStaged = parseInt(quotaRes.rows[0].total_staged, 10);
        if (totalStaged + req.file.size > MAX_ANON_STAGING_BYTES) {
          return res.status(503).json({
            success: false,
            message: 'Anonymous staging storage capacity temporarily full; please retry later.',
          });
        }
      }

      // 5. Derive Owner Entity in Authenticated Mode
      let entityType = 'unattached';
      let entityId = null;
      let isAttached = false;
      let expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      let resetCompliance = false;
      let targetEntityTable = null;
      let priorStatus = null;

      if (isAuthenticated) {
        isAttached = true;
        expiresAt = null;

        if (authUser.role === 'merchant') {
          const mRes = await client.query(
            `SELECT id, approval_status FROM merchants WHERE user_id = $1`,
            [authUser.id]
          );
          if (mRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
          }
          entityType = 'merchant';
          entityId = mRes.rows[0].id;
          targetEntityTable = 'merchants';
          priorStatus = mRes.rows[0].approval_status;
          if (priorStatus === 'approved' || priorStatus === 'rejected') {
            resetCompliance = true;
          }
        } else if (authUser.role === 'provider') {
          const pRes = await client.query(
            `SELECT id, approval_status FROM providers WHERE user_id = $1`,
            [authUser.id]
          );
          if (pRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
          }
          entityType = 'provider';
          entityId = pRes.rows[0].id;
          targetEntityTable = 'providers';
          priorStatus = pRes.rows[0].approval_status;
          if (priorStatus === 'approved' || priorStatus === 'rejected') {
            resetCompliance = true;
          }
        } else if (authUser.role === 'admin' || authUser.role === 'super_admin') {
          entityType = 'unattached';
        }
      }

      // 6. Write file to private disk with randomized UUID name
      const storedFileName = `${crypto.randomUUID()}.${detected.ext}`;
      writtenFilePath = path.join(UPLOADS_DIR, storedFileName);
      await fs.promises.writeFile(writtenFilePath, req.file.buffer);

      await client.query('BEGIN');

      // 7. Insert document record
      const originalName = path.basename(req.file.originalname).slice(0, 255);
      const insertRes = await client.query(
        `INSERT INTO documents (
           entity_type, entity_id, document_type, file_url, file_name, mime_type,
           purpose, file_size, storage_path, is_attached, expires_at, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
         RETURNING id, entity_type, entity_id, purpose, file_name, status, uploaded_at`,
        [
          entityType,
          entityId,
          purpose,
          `/api/documents/private/${storedFileName}`,
          originalName,
          detected.mime,
          purpose,
          req.file.size,
          writtenFilePath,
          isAttached,
          expiresAt,
        ]
      );

      const doc = insertRes.rows[0];

      // 8. If approved or rejected entity re-uploads a KYC document, reset status to pending
      if (resetCompliance && targetEntityTable && entityId) {
        await client.query(
          `UPDATE ${targetEntityTable}
           SET approval_status = 'pending',
               rejection_reason = NULL,
               reviewed_by = NULL,
               reviewed_at = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [entityId]
        );

        const auditAction = priorStatus === 'rejected' ? 'KYC_RESUBMISSION' : 'COMPLIANCE_RESET';
        const auditReason = priorStatus === 'rejected' ? 'kyc_document_resubmission' : 'kyc_document_replacement';

        await logAuditEvent({
          userId: authUser.id,
          action: auditAction,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: {
            reason: auditReason,
            document_id: doc.id,
            entity_type: entityType,
          },
        });
      }

      // Dispatch onboarding application notifications (Batch 11 Notification Engine)
      if (isAuthenticated && ['provider', 'merchant'].includes(authUser.role)) {
        try {
          await notify('onboarding.application_received', {
            organizationName: authUser.full_name || 'Healthcare Partner',
            referenceNumber: doc.id.slice(0, 8).toUpperCase(),
          }, {
            subjectType: 'user',
            subjectId: authUser.id,
            actorUserId: authUser.id,
          }, client);

          await notify('onboarding.admin_new_application', {
            organizationName: authUser.full_name || 'Healthcare Partner',
            category: authUser.role,
            licenseNumber: doc.file_name,
          }, {
            subjectType: 'system',
            adminPermission: 'kyc.view',
            actorUserId: authUser.id,
          }, client);
        } catch (notifErr) {
          console.warn('[KYC Documents] Notification dispatch warning:', notifErr.message);
        }
      }

      await client.query('COMMIT');

      // 9. Response formatting
      if (!isAuthenticated) {
        const stagingToken = issueStagingToken(doc.id);
        return res.status(201).json({
          success: true,
          message: 'Document staged successfully for partner proposal.',
          document_id: doc.id,
          original_name: doc.file_name,
          staging_token: stagingToken,
          expires_at: expiresAt,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'KYC document uploaded successfully.',
        document_id: doc.id,
        original_name: doc.file_name,
        purpose: doc.purpose,
        status: doc.status,
      });

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      if (writtenFilePath) {
        await fs.promises.unlink(writtenFilePath).catch(() => {});
      }
      console.error('[Document Upload Error]', err.message);
      return res.status(500).json({ success: false, message: 'Failed to process document upload.' });
    } finally {
      client.release();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   GET /api/documents/:id/view
   Authorized streaming document viewer with security headers
   ───────────────────────────────────────────────────────────── */
router.get('/:id/view', requireAuth, async (req, res) => {
  const docId = req.params.id;
  const user = req.user;

  try {
    const docRes = await pool.query(
      `SELECT id, entity_type, entity_id, file_name, mime_type, storage_path, purpose, status
       FROM documents
       WHERE id = $1`,
      [docId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docRes.rows[0];

    // Authorization & Cross-Tenant Check
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    let isOwner = false;

    if (!isAdmin) {
      if (doc.entity_type === 'merchant' && user.role === 'merchant') {
        const mCheck = await pool.query(`SELECT id FROM merchants WHERE user_id = $1`, [user.id]);
        if (mCheck.rows.length > 0 && mCheck.rows[0].id === doc.entity_id) {
          isOwner = true;
        }
      } else if (doc.entity_type === 'provider' && user.role === 'provider') {
        const pCheck = await pool.query(`SELECT id FROM providers WHERE user_id = $1`, [user.id]);
        if (pCheck.rows.length > 0 && pCheck.rows[0].id === doc.entity_id) {
          isOwner = true;
        }
      }

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions to view this document.' });
      }
    }

    // Verify file exists on disk
    if (!fs.existsSync(doc.storage_path)) {
      return res.status(404).json({ success: false, message: 'Document file not found on disk.' });
    }

    // Audit Log on document view (tokens are NEVER logged)
    await logAuditEvent({
      userId: user.id,
      action: 'DOCUMENT_VIEWED',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        document_id: doc.id,
        entity_type: doc.entity_type,
        purpose: doc.purpose,
      },
    });

    // Set Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    const safeName = (doc.file_name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    // Stream file
    const stream = fs.createReadStream(doc.storage_path);
    stream.on('error', (err) => {
      console.error('[Document Stream Error]', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to stream document.' });
      }
    });
    stream.pipe(res);

  } catch (err) {
    console.error('[Document View Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve document.' });
  }
});

module.exports = router;
