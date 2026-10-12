/**
 * ODS Global Network — Provider Routes
 *
 * Implements:
 * - GET /api/provider/profile: Returns provider profile, primary facility address, contact person
 * - PUT /api/provider/profile: Updates profile; resets compliance to 'pending' if compliance-critical fields change on an approved entity
 * - GET /api/provider/documents: Lists uploaded KYC documents for current provider
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('provider'));

/* ─────────────────────────────────────────────────────────────
   GET /api/provider/profile
   ───────────────────────────────────────────────────────────── */
router.get('/profile', async (req, res) => {
  try {
    const providerRes = await pool.query(
      `SELECT id, user_id, provider_name, provider_type, service_category,
              official_phone, official_email, website, description,
              services_offered, operating_hours, availability, license_no,
              approval_status, rejection_reason, reviewed_at, created_at, updated_at
       FROM providers
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (providerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const provider = providerRes.rows[0];

    const [addrRes, contactRes] = await Promise.all([
      pool.query(
        `SELECT id, country, region_state, city, postal_code, address_line, branch_code, gps_lat, gps_lng
         FROM addresses
         WHERE entity_type = 'provider' AND entity_id = $1
         LIMIT 1`,
        [provider.id]
      ),
      pool.query(
        `SELECT id, full_name, position_role, email, phone
         FROM contact_persons
         WHERE entity_type = 'provider' AND entity_id = $1
         LIMIT 1`,
        [provider.id]
      ),
    ]);

    return res.json({
      success: true,
      profile: {
        ...provider,
        address: addrRes.rows[0] || null,
        contact_person: contactRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('[Provider Profile Get Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve provider profile.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/provider/profile
   ───────────────────────────────────────────────────────────── */
router.put('/profile', async (req, res) => {
  const {
    provider_name,
    provider_type,
    service_category,
    official_phone,
    official_email,
    website,
    description,
    services_offered,
    operating_hours,
    availability,
    license_no,
    address,
    contact_person,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current profile
    const currentRes = await client.query(
      `SELECT id, provider_name, provider_type, service_category, official_phone,
              official_email, website, description, services_offered, operating_hours,
              availability, license_no, approval_status
       FROM providers
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const current = currentRes.rows[0];
    const providerId = current.id;

    // 2. Fetch current address
    const currentAddrRes = await client.query(
      `SELECT id, country, region_state, city, postal_code, address_line
       FROM addresses
       WHERE entity_type = 'provider' AND entity_id = $1
       LIMIT 1`,
      [providerId]
    );
    const currentAddr = currentAddrRes.rows[0] || {};

    // 3. Compliance Check for Approved Entities (OD-1: provider_name, provider_type, license_no, address)
    let resetCompliance = false;
    const modifiedComplianceFields = [];

    if (current.approval_status === 'approved') {
      if (provider_name !== undefined && provider_name.trim() !== current.provider_name) {
        resetCompliance = true;
        modifiedComplianceFields.push('provider_name');
      }
      if (provider_type !== undefined && (provider_type || null) !== (current.provider_type || null)) {
        resetCompliance = true;
        modifiedComplianceFields.push('provider_type');
      }
      if (license_no !== undefined && (license_no || null) !== (current.license_no || null)) {
        resetCompliance = true;
        modifiedComplianceFields.push('license_no');
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

    // 4. Update provider profile
    const newStatus = resetCompliance ? 'pending' : current.approval_status;
    const newName = provider_name !== undefined ? provider_name.trim() : current.provider_name;
    const newType = provider_type !== undefined ? provider_type : current.provider_type;
    const newCategory = service_category !== undefined ? service_category : current.service_category;
    const newPhone = official_phone !== undefined ? official_phone : current.official_phone;
    const newEmail = official_email !== undefined ? official_email : current.official_email;
    const newWebsite = website !== undefined ? website : current.website;
    const newDesc = description !== undefined ? description : current.description;
    const newServices = services_offered !== undefined ? services_offered : current.services_offered;
    const newHours = operating_hours !== undefined ? operating_hours : current.operating_hours;
    const newAvail = availability !== undefined ? availability : current.availability;
    const newLicense = license_no !== undefined ? license_no : current.license_no;

    const updateProviderRes = await client.query(
      `UPDATE providers
       SET provider_name = $1,
           provider_type = $2,
           service_category = $3,
           official_phone = $4,
           official_email = $5,
           website = $6,
           description = $7,
           services_offered = $8,
           operating_hours = $9,
           availability = $10,
           license_no = $11,
           approval_status = $12,
           rejection_reason = CASE WHEN $13 = true THEN NULL ELSE rejection_reason END,
           reviewed_by = CASE WHEN $13 = true THEN NULL ELSE reviewed_by END,
           reviewed_at = CASE WHEN $13 = true THEN NULL ELSE reviewed_at END,
           updated_at = NOW()
       WHERE id = $14
       RETURNING id, provider_name, provider_type, service_category, official_phone, official_email,
                 website, description, services_offered, operating_hours, availability, license_no,
                 approval_status, rejection_reason, updated_at`,
      [
        newName,
        newType,
        newCategory,
        newPhone,
        newEmail,
        newWebsite,
        newDesc,
        newServices,
        newHours,
        newAvail,
        newLicense,
        newStatus,
        resetCompliance,
        providerId,
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
           VALUES ('provider', $1, $2, $3, $4, $5, $6, $7)
           RETURNING id, country, region_state, city, postal_code, address_line, branch_code`,
          [
            providerId,
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
        `SELECT id FROM contact_persons WHERE entity_type = 'provider' AND entity_id = $1 LIMIT 1`,
        [providerId]
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
           VALUES ('provider', $1, $2, $3, $4, $5)
           RETURNING id, full_name, position_role, email, phone`,
          [
            providerId,
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
          entity_type: 'provider',
          entity_id: providerId,
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
        ...updateProviderRes.rows[0],
        address: updatedAddress,
        contact_person: updatedContact,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Provider Profile Update Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update provider profile.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/provider/documents
   ───────────────────────────────────────────────────────────── */
router.get('/documents', async (req, res) => {
  try {
    const providerRes = await pool.query(
      `SELECT id FROM providers WHERE user_id = $1`,
      [req.user.id]
    );

    if (providerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const providerId = providerRes.rows[0].id;

    const docRes = await pool.query(
      `SELECT id, entity_type, entity_id, document_type, file_name, mime_type,
              purpose, file_size, status, uploaded_at, rejection_reason
       FROM documents
       WHERE entity_type = 'provider' AND entity_id = $1
       ORDER BY uploaded_at DESC`,
      [providerId]
    );

    return res.json({
      success: true,
      documents: docRes.rows,
    });
  } catch (err) {
    console.error('[Provider Documents List Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

module.exports = router;
