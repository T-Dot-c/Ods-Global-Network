/**
 * ODS Global Network — Merchant Routes
 *
 * Implements:
 * - GET /api/merchant/profile: Returns merchant profile, primary address, contact person
 * - PUT /api/merchant/profile: Updates profile; resets compliance to 'pending' if compliance-critical fields change on an approved entity
 * - GET /api/merchant/documents: Lists uploaded KYC documents for current merchant
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, requireVerifiedEmail } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('merchant'));

/* ─────────────────────────────────────────────────────────────
   GET /api/merchant/profile
   ───────────────────────────────────────────────────────────── */
router.get('/profile', async (req, res) => {
  try {
    const merchantRes = await pool.query(
      `SELECT id, user_id, business_name, business_type, category,
              business_phone, business_email, website, description,
              approval_status, rejection_reason, reviewed_at, created_at, updated_at
       FROM merchants
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (merchantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
    }

    const merchant = merchantRes.rows[0];

    const [addrRes, contactRes] = await Promise.all([
      pool.query(
        `SELECT id, country, region_state, city, postal_code, address_line, branch_code, gps_lat, gps_lng
         FROM addresses
         WHERE entity_type = 'merchant' AND entity_id = $1
         LIMIT 1`,
        [merchant.id]
      ),
      pool.query(
        `SELECT id, full_name, position_role, email, phone
         FROM contact_persons
         WHERE entity_type = 'merchant' AND entity_id = $1
         LIMIT 1`,
        [merchant.id]
      ),
    ]);

    return res.json({
      success: true,
      profile: {
        ...merchant,
        address: addrRes.rows[0] || null,
        contact_person: contactRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('[Merchant Profile Get Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve merchant profile.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/merchant/profile
   ───────────────────────────────────────────────────────────── */
router.put('/profile', requireVerifiedEmail, async (req, res) => {
  const {
    business_name,
    business_type,
    category,
    business_phone,
    business_email,
    website,
    description,
    address,
    contact_person,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current profile
    const currentRes = await client.query(
      `SELECT id, business_name, business_type, category, business_phone, business_email,
              website, description, approval_status
       FROM merchants
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
    }

    const current = currentRes.rows[0];
    const merchantId = current.id;

    // 2. Fetch current address
    const currentAddrRes = await client.query(
      `SELECT id, country, region_state, city, postal_code, address_line
       FROM addresses
       WHERE entity_type = 'merchant' AND entity_id = $1
       LIMIT 1`,
      [merchantId]
    );
    const currentAddr = currentAddrRes.rows[0] || {};

    // 3. Compliance Check for Approved Entities
    let resetCompliance = false;
    const modifiedComplianceFields = [];

    if (current.approval_status === 'approved') {
      if (business_name !== undefined && business_name.trim() !== current.business_name) {
        resetCompliance = true;
        modifiedComplianceFields.push('business_name');
      }
      if (category !== undefined && (category || null) !== (current.category || null)) {
        resetCompliance = true;
        modifiedComplianceFields.push('category');
      }

      if (address) {
        const addrFields = ['address_line', 'city', 'postal_code', 'region_state', 'country'];
        for (const f of addrFields) {
          if (address[f] !== undefined && (address[f] || null) !== (currentAddr[f] || null)) {
            resetCompliance = true;
            modifiedComplianceFields.push(`address.${f}`);
          }
        }
      }
    }

    // 4. Update merchant profile
    const newStatus = resetCompliance ? 'pending' : current.approval_status;
    const newBusinessName = business_name !== undefined ? business_name.trim() : current.business_name;
    const newBusinessType = business_type !== undefined ? business_type : current.business_type;
    const newCategory = category !== undefined ? category : current.category;
    const newPhone = business_phone !== undefined ? business_phone : current.business_phone;
    const newEmail = business_email !== undefined ? business_email : current.business_email;
    const newWebsite = website !== undefined ? website : current.website;
    const newDesc = description !== undefined ? description : current.description;

    const updateMerchantRes = await client.query(
      `UPDATE merchants
       SET business_name = $1,
           business_type = $2,
           category = $3,
           business_phone = $4,
           business_email = $5,
           website = $6,
           description = $7,
           approval_status = $8,
           rejection_reason = CASE WHEN $9 = true THEN NULL ELSE rejection_reason END,
           reviewed_by = CASE WHEN $9 = true THEN NULL ELSE reviewed_by END,
           reviewed_at = CASE WHEN $9 = true THEN NULL ELSE reviewed_at END,
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, business_name, business_type, category, business_phone, business_email,
                 website, description, approval_status, rejection_reason, updated_at`,
      [
        newBusinessName,
        newBusinessType,
        newCategory,
        newPhone,
        newEmail,
        newWebsite,
        newDesc,
        newStatus,
        resetCompliance,
        merchantId,
      ]
    );

    // 5. Update or Insert Address
    let updatedAddress = currentAddr;
    if (address) {
      if (currentAddr.id) {
        const addrUpdate = await client.query(
          `UPDATE addresses
           SET country = COALESCE($1, country),
               region_state = COALESCE($2, region_state),
               city = COALESCE($3, city),
               postal_code = COALESCE($4, postal_code),
               address_line = COALESCE($5, address_line),
               branch_code = COALESCE($6, branch_code),
               updated_at = NOW()
           WHERE id = $7
           RETURNING id, country, region_state, city, postal_code, address_line, branch_code`,
          [
            address.country,
            address.region_state,
            address.city,
            address.postal_code,
            address.address_line,
            address.branch_code,
            currentAddr.id,
          ]
        );
        updatedAddress = addrUpdate.rows[0];
      } else {
        const addrInsert = await client.query(
          `INSERT INTO addresses (entity_type, entity_id, country, region_state, city, postal_code, address_line, branch_code)
           VALUES ('merchant', $1, $2, $3, $4, $5, $6, $7)
           RETURNING id, country, region_state, city, postal_code, address_line, branch_code`,
          [
            merchantId,
            address.country || null,
            address.region_state || null,
            address.city || null,
            address.postal_code || null,
            address.address_line || null,
            address.branch_code || null,
          ]
        );
        updatedAddress = addrInsert.rows[0];
      }
    }

    // 6. Update or Insert Contact Person
    let updatedContact = null;
    if (contact_person) {
      const contactCheck = await client.query(
        `SELECT id FROM contact_persons WHERE entity_type = 'merchant' AND entity_id = $1 LIMIT 1`,
        [merchantId]
      );
      if (contactCheck.rows.length > 0) {
        const contactUpdate = await client.query(
          `UPDATE contact_persons
           SET full_name = COALESCE($1, full_name),
               position_role = COALESCE($2, position_role),
               email = COALESCE($3, email),
               phone = COALESCE($4, phone),
               updated_at = NOW()
           WHERE id = $5
           RETURNING id, full_name, position_role, email, phone`,
          [
            contact_person.full_name,
            contact_person.position_role,
            contact_person.email,
            contact_person.phone,
            contactCheck.rows[0].id,
          ]
        );
        updatedContact = contactUpdate.rows[0];
      } else if (contact_person.full_name) {
        const contactInsert = await client.query(
          `INSERT INTO contact_persons (entity_type, entity_id, full_name, position_role, email, phone)
           VALUES ('merchant', $1, $2, $3, $4, $5)
           RETURNING id, full_name, position_role, email, phone`,
          [
            merchantId,
            contact_person.full_name,
            contact_person.position_role || null,
            contact_person.email || null,
            contact_person.phone || null,
          ]
        );
        updatedContact = contactInsert.rows[0];
      }
    }

    // 7. Audit Log on Compliance Reset
    if (resetCompliance) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'COMPLIANCE_RESET',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          reason: 'compliance_fields_modified',
          modified_fields: modifiedComplianceFields,
          entity_type: 'merchant',
          entity_id: merchantId,
        },
      });
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: resetCompliance
        ? 'Profile updated. Status reset to pending review due to compliance field changes.'
        : 'Profile updated successfully.',
      profile: {
        ...updateMerchantRes.rows[0],
        address: updatedAddress,
        contact_person: updatedContact,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Merchant Profile Update Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update merchant profile.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/merchant/documents
   ───────────────────────────────────────────────────────────── */
router.get('/documents', async (req, res) => {
  try {
    const merchantRes = await pool.query(
      `SELECT id FROM merchants WHERE user_id = $1`,
      [req.user.id]
    );

    if (merchantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
    }

    const merchantId = merchantRes.rows[0].id;

    const docRes = await pool.query(
      `SELECT id, entity_type, entity_id, document_type, file_name, mime_type,
              purpose, file_size, status, uploaded_at, rejection_reason
       FROM documents
       WHERE entity_type = 'merchant' AND entity_id = $1
       ORDER BY uploaded_at DESC`,
      [merchantId]
    );

    return res.json({
      success: true,
      documents: docRes.rows,
    });
  } catch (err) {
    console.error('[Merchant Documents List Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

module.exports = router;
