/**
 * ODS Global Network — Authoring Routes for Merchants & Providers
 * Batch 8: Service Catalog Management
 */
'use strict';

const express = require('express');
const { requireAuth, requireVerifiedEmail } = require('../middleware/auth');
const serviceCatalogService = require('../services/serviceCatalogService');
const pool = require('../db');

const router = express.Router();

// All routes require authentication and verified email
router.use(requireAuth, requireVerifiedEmail);

/**
 * GET /api/my/services
 * List all authored services for current merchant or provider
 */
router.get('/', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await serviceCatalogService.getOwnerServices({
      ownerUserId: req.user.id,
      status,
      page,
      limit
    });
    return res.json({ success: true, data: result.services, pagination: result.pagination });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/services
 * Create a new service draft
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      short_description,
      description,
      categoryId,
      category_id,
      category,
      priceAmount,
      price_amount,
      price,
      currency,
      durationMinutes,
      duration_minutes,
      capacity,
      leadTimeHours,
      lead_time_hours,
      locationType,
      location_type,
      city,
      area,
      cancellationNote,
      cancellation_note,
      tags
    } = req.body;

    const created = await serviceCatalogService.createService({
      ownerUserId: req.user.id,
      title,
      shortDescription: shortDescription || short_description,
      description,
      categoryId: categoryId || category_id,
      category,
      priceAmount: priceAmount !== undefined ? priceAmount : (price_amount !== undefined ? price_amount : price),
      currency,
      durationMinutes: durationMinutes !== undefined ? durationMinutes : duration_minutes,
      capacity,
      leadTimeHours: leadTimeHours !== undefined ? leadTimeHours : lead_time_hours,
      locationType: locationType || location_type,
      city,
      area,
      cancellationNote: cancellationNote || cancellation_note,
      tags
    });

    return res.status(201).json({
      success: true,
      message: 'Service draft created successfully',
      data: created
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/my/services/:id
 * Retrieve single owned service with gallery and status history
 */
router.get('/:id', async (req, res) => {
  try {
    const sRes = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const service = sRes.rows[0];
    if (service.owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this service listing' });
    }

    const imagesRes = await pool.query(
      'SELECT id, upload_id, image_url, sort_order, is_cover, alt_text FROM service_images WHERE service_id = $1 ORDER BY is_cover DESC, sort_order ASC',
      [service.id]
    );

    const historyRes = await pool.query(
      `SELECT h.*, u.full_name AS actor_name
       FROM service_status_history h
       JOIN users u ON h.actor_user_id = u.id
       WHERE h.service_id = $1
       ORDER BY h.created_at DESC`,
      [service.id]
    );

    return res.json({
      success: true,
      data: {
        ...service,
        gallery: imagesRes.rows,
        statusHistory: historyRes.rows
      }
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/my/services/:id
 * Edit fields of owned service (triggers re-moderation if sensitive fields modified while published)
 */
router.patch('/:id', async (req, res) => {
  try {
    const updated = await serviceCatalogService.updateService({
      serviceId: req.params.id,
      ownerUserId: req.user.id,
      updates: req.body
    });

    return res.json({
      success: true,
      message: 'Service updated successfully',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/services/:id/publish
 * Transition service to published (or pending_review for moderation)
 */
router.post('/:id/publish', async (req, res) => {
  try {
    // Check ownership
    const sRes = await pool.query('SELECT owner_user_id, status FROM services WHERE id = $1', [req.params.id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (sRes.rows[0].owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this service' });
    }

    // New services and re-submissions transition to pending_review
    const targetStatus = sRes.rows[0].status === 'unpublished' ? 'published' : 'pending_review';

    const updated = await serviceCatalogService.transitionServiceStatus({
      serviceId: req.params.id,
      toStatus: targetStatus,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      reason: 'Owner requested publishing'
    });

    return res.json({
      success: true,
      message: targetStatus === 'published' ? 'Service published live' : 'Service submitted for moderation review',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/services/:id/unpublish
 * Owner takes published service offline to unpublished
 */
router.post('/:id/unpublish', async (req, res) => {
  try {
    const sRes = await pool.query('SELECT owner_user_id FROM services WHERE id = $1', [req.params.id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (sRes.rows[0].owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this service' });
    }

    const updated = await serviceCatalogService.transitionServiceStatus({
      serviceId: req.params.id,
      toStatus: 'unpublished',
      actorUserId: req.user.id,
      actorRole: req.user.role,
      reason: req.body.reason || 'Owner unpublished service'
    });

    return res.json({
      success: true,
      message: 'Service unpublished successfully',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/services/:id/archive
 * Soft-remove service
 */
router.post('/:id/archive', async (req, res) => {
  try {
    const sRes = await pool.query('SELECT owner_user_id FROM services WHERE id = $1', [req.params.id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (sRes.rows[0].owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this service' });
    }

    const updated = await serviceCatalogService.transitionServiceStatus({
      serviceId: req.params.id,
      toStatus: 'archived',
      actorUserId: req.user.id,
      actorRole: req.user.role,
      reason: req.body.reason || 'Owner archived service'
    });

    return res.json({
      success: true,
      message: 'Service archived successfully',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/services/:id/images
 * Link an uploaded image (reusing Batch 4 document upload system) to service
 */
router.post('/:id/images', async (req, res) => {
  try {
    const {
      uploadId,
      upload_id,
      documentId,
      document_id,
      imageUrl,
      image_url,
      sortOrder,
      sort_order,
      isCover,
      is_cover,
      altText,
      alt_text
    } = req.body;

    const effectiveUploadId = uploadId || upload_id || documentId || document_id;
    let effectiveImageUrl = imageUrl || image_url;
    const effectiveSortOrder = sortOrder !== undefined ? sortOrder : (sort_order !== undefined ? sort_order : 0);
    const effectiveIsCover = isCover !== undefined ? isCover : (is_cover !== undefined ? is_cover : false);
    const effectiveAltText = altText !== undefined ? altText : alt_text;

    // If uploadId provided, verify document belongs to current user/provider/merchant
    if (effectiveUploadId) {
      const docRes = await pool.query(
        `SELECT d.*
         FROM documents d
         WHERE d.id = $1 AND (
           (d.entity_type = 'provider' AND d.entity_id IN (SELECT id FROM providers WHERE user_id = $2)) OR
           (d.entity_type = 'merchant' AND d.entity_id IN (SELECT id FROM merchants WHERE user_id = $2))
         )`,
        [effectiveUploadId, req.user.id]
      );
      if (docRes.rows.length === 0) {
        const anyDoc = await pool.query('SELECT id FROM documents WHERE id = $1', [effectiveUploadId]);
        if (anyDoc.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Uploaded document not found' });
        }
        return res.status(403).json({ success: false, message: 'Unauthorized: Document does not belong to you' });
      }
      if (!effectiveImageUrl && docRes.rows[0].file_url) {
        effectiveImageUrl = docRes.rows[0].file_url;
      }
    }

    if (!effectiveImageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL or valid document upload is required' });
    }

    const linked = await serviceCatalogService.linkServiceImage({
      serviceId: req.params.id,
      ownerUserId: req.user.id,
      uploadId: effectiveUploadId,
      imageUrl: effectiveImageUrl,
      sortOrder: effectiveSortOrder,
      isCover: effectiveIsCover,
      altText: effectiveAltText
    });

    return res.status(201).json({
      success: true,
      message: 'Image linked to service successfully',
      data: linked
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/my/services/:id/images/:imageId
 * Remove an image link from service
 */
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const result = await serviceCatalogService.unlinkServiceImage({
      serviceId: req.params.id,
      ownerUserId: req.user.id,
      imageId: req.params.imageId
    });

    return res.json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

module.exports = router;
