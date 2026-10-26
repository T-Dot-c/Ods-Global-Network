/**
 * ODS Global Network — Public Service Catalog & Provider Directory Router
 * Batch 8: Healthcare Service Catalog & Directory
 */
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const serviceCatalogService = require('../services/serviceCatalogService');

const router = express.Router();

/* ── Rate limiters ─────────────────────────────────────────── */
const catalogQueryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.ALLOW_DESTRUCTIVE_TESTS === '1',
  message: { success: false, message: 'Too many catalog requests — please slow down.' }
});

/* ─────────────────────────────────────────────────────────────
   Public Catalog Endpoints
   ───────────────────────────────────────────────────────────── */

/**
 * GET /api/services
 * Public search, filter, and pagination
 */
router.get('/', catalogQueryLimiter, async (req, res) => {
  try {
    const {
      category,
      categoryId,
      search,
      q,
      minPrice,
      min_price,
      maxPrice,
      max_price,
      deliveryType,
      delivery_type,
      locationType,
      location_type,
      city,
      area,
      minDuration,
      min_duration,
      maxDuration,
      max_duration,
      sort,
      page,
      limit
    } = req.query;

    const result = await serviceCatalogService.getPublicCatalog({
      categoryId: categoryId || category,
      search: search || q,
      minPrice: minPrice || min_price,
      maxPrice: maxPrice || max_price,
      locationType: locationType || location_type || deliveryType || delivery_type,
      city,
      area,
      minDuration: minDuration || min_duration,
      maxDuration: maxDuration || max_duration,
      sort,
      page,
      limit
    });
    return res.json({ success: true, data: result.services, pagination: result.pagination });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/services/categories
 * Returns taxonomy of categories with active service counts
 */
router.get('/categories', async (_req, res) => {
  try {
    const categories = await serviceCatalogService.getCategoriesWithCounts();
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/services/providers
 * Public healthcare provider directory
 */
router.get('/providers', catalogQueryLimiter, async (req, res) => {
  try {
    const { category, search, city, page, limit } = req.query;
    const result = await serviceCatalogService.getProvidersDirectory({
      category,
      search,
      city,
      page,
      limit
    });
    return res.json({ success: true, data: result.providers, pagination: result.pagination });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/services/:id/reviews (Backward-compatibility stub: reviews non-goal in Batch 8)
 */
router.get('/:id/reviews', async (_req, res) => {
  return res.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
  });
});

/**
 * GET /api/services/:slug
 * Public single service detail with owner information and gallery images (published only)
 */
router.get('/:slug', async (req, res) => {
  try {
    const service = await serviceCatalogService.getPublicServiceBySlug(req.params.slug);
    return res.json({ success: true, data: service });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
