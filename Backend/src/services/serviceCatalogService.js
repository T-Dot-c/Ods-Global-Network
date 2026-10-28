/**
 * ODS Global Network — Service Catalog Engine
 * Batch 8: Full Specification Service Catalog & Provider/Merchant Directory
 */
'use strict';

const crypto = require('crypto');
const pool = require('../db');
const { logAuditEvent } = require('./auditService');
const { notify } = require('./notificationService');

// ── Lifecycle States & Transition Map ─────────────────────────────
const SERVICE_STATES = [
  'draft',
  'pending_review',
  'published',
  'unpublished',
  'rejected',
  'taken_down',
  'archived'
];

const ALLOWED_TRANSITIONS = {
  draft: ['pending_review', 'archived'],
  pending_review: ['published', 'rejected', 'draft', 'archived'],
  published: ['unpublished', 'taken_down', 'archived'],
  unpublished: ['published', 'pending_review', 'archived'],
  rejected: ['draft', 'pending_review', 'archived'],
  taken_down: ['published', 'unpublished', 'archived'],
  archived: [] // terminal state
};

const ALLOWED_LOCATION_TYPES = ['on_site', 'at_customer', 'online'];

/**
 * Generate collision-free clean URL slug
 */
function generateSlug(title) {
  const base = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'service';
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Normalize tags array (lowercase, trimmed, deduplicated, max 10)
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const set = new Set();
  for (const t of tags) {
    if (typeof t === 'string' && t.trim()) {
      set.add(t.trim().toLowerCase().slice(0, 40));
    }
  }
  return Array.from(set).slice(0, 10);
}

/**
 * Transition service status through the validated state machine
 */
async function transitionServiceStatus({
  serviceId,
  toStatus,
  actorUserId,
  actorRole = null,
  reason = null,
  dbClient = null
}) {
  const client = dbClient || pool;

  if (!SERVICE_STATES.includes(toStatus)) {
    const err = new Error(`Invalid target status: '${toStatus}'. Must be one of: ${SERVICE_STATES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Fetch current service state with row-lock for atomic transition
  const querySql = dbClient
    ? 'SELECT * FROM services WHERE id = $1 FOR UPDATE'
    : 'SELECT * FROM services WHERE id = $1';
  const { rows } = await client.query(querySql, [serviceId]);
  if (rows.length === 0) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  const current = rows[0];
  const fromStatus = current.status;

  // Verify transition is permitted
  const allowedNext = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowedNext.includes(toStatus)) {
    const err = new Error(`Illegal status transition from '${fromStatus}' to '${toStatus}'`);
    err.statusCode = 400;
    throw err;
  }

  // Check RBAC permissions for state transitions
  if (toStatus === 'published' && fromStatus === 'pending_review') {
    if (actorRole && !['admin', 'super_admin'].includes(actorRole)) {
      const err = new Error('Unauthorized: Only administrators can approve pending services to published');
      err.statusCode = 403;
      throw err;
    }
  }

  if (toStatus === 'rejected') {
    if (actorRole && !['admin', 'super_admin'].includes(actorRole)) {
      const err = new Error('Unauthorized: Only administrators can reject service submissions');
      err.statusCode = 403;
      throw err;
    }
    if (!reason || !reason.trim()) {
      const err = new Error('Rejection reason is required when rejecting a service');
      err.statusCode = 400;
      throw err;
    }
  }

  if (toStatus === 'taken_down') {
    if (actorRole && !['admin', 'super_admin'].includes(actorRole)) {
      const err = new Error('Unauthorized: Only administrators can take down published services');
      err.statusCode = 403;
      throw err;
    }
    if (!reason || !reason.trim()) {
      const err = new Error('Takedown reason is required when taking down a service');
      err.statusCode = 400;
      throw err;
    }
  }

  if (fromStatus === 'taken_down' && (toStatus === 'published' || toStatus === 'unpublished')) {
    if (actorRole && !['admin', 'super_admin'].includes(actorRole)) {
      const err = new Error('Unauthorized: Only administrators can restore taken-down services');
      err.statusCode = 403;
      throw err;
    }
  }

  // Update services table
  const updateSql = `
    UPDATE services
    SET
      status = $1::varchar,
      published_at = CASE WHEN $1::text = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END,
      rejection_reason = CASE WHEN $1::text = 'rejected' THEN $2::text ELSE rejection_reason END,
      takedown_reason = CASE WHEN $1::text = 'taken_down' THEN $2::text WHEN $1::text = 'published' THEN NULL ELSE takedown_reason END,
      is_active = CASE WHEN $1::text IN ('published', 'draft', 'pending_review', 'unpublished') THEN TRUE ELSE FALSE END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  const updateRes = await client.query(updateSql, [toStatus, reason ? reason.trim() : null, serviceId]);
  const updatedService = updateRes.rows[0];

  // Insert ledger record into service_status_history
  await client.query(
    `INSERT INTO service_status_history (service_id, from_status, to_status, actor_user_id, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [serviceId, fromStatus, toStatus, actorUserId, reason ? reason.trim() : null]
  );

  // Dispatch catalog notifications (Batch 11 Notification Engine)
  try {
    const ownerQuery = `
      SELECT s.title, COALESCE(p.provider_name, m.business_name, 'Provider') as provider_name,
             COALESCE(p.user_id, m.user_id) as owner_user_id
      FROM services s
      LEFT JOIN providers p ON p.id = s.provider_id
      LEFT JOIN merchants m ON m.id = s.merchant_id
      WHERE s.id = $1;
    `;
    const ownerRes = await client.query(ownerQuery, [serviceId]);
    if (ownerRes.rows.length > 0 && ownerRes.rows[0].owner_user_id) {
      const owner = ownerRes.rows[0];
      const payload = {
        serviceTitle: owner.title,
        providerName: owner.provider_name,
        feedback: reason || undefined,
        reason: reason || undefined,
      };
      const options = {
        subjectType: 'user',
        subjectId: owner.owner_user_id,
        actorUserId,
      };

      if (toStatus === 'pending_review') {
        await notify('catalog.service_submitted', payload, options, client);
      } else if (toStatus === 'published' && fromStatus === 'pending_review') {
        await notify('catalog.service_approved', payload, options, client);
      } else if (toStatus === 'rejected') {
        await notify('catalog.service_rejected', payload, options, client);
      } else if (toStatus === 'taken_down') {
        await notify('catalog.service_taken_down', payload, options, client);
      }
    }
  } catch (notifErr) {
    console.warn('[Catalog Moderation] Notification dispatch warning:', notifErr.message);
  }

  return updatedService;
}

/**
 * Resolve KYC approval status and entity details for an owner user
 */
async function resolveApprovedOwner(userId) {
  // Check provider profile
  const provRes = await pool.query(
    `SELECT id, provider_name AS entity_name, 'provider' AS owner_type, approval_status, official_phone
     FROM providers WHERE user_id = $1`,
    [userId]
  );
  if (provRes.rows.length > 0) {
    const p = provRes.rows[0];
    if (p.approval_status !== 'approved') {
      const err = new Error('Your healthcare provider account KYC is currently pending review. Only approved providers can publish services.');
      err.statusCode = 403;
      throw err;
    }
    return p;
  }

  // Check merchant profile
  const merchRes = await pool.query(
    `SELECT id, business_name AS entity_name, 'merchant' AS owner_type, approval_status, business_phone AS official_phone
     FROM merchants WHERE user_id = $1`,
    [userId]
  );
  if (merchRes.rows.length > 0) {
    const m = merchRes.rows[0];
    if (m.approval_status !== 'approved') {
      const err = new Error('Your merchant business account KYC is currently pending review. Only approved merchants can publish services.');
      err.statusCode = 403;
      throw err;
    }
    return m;
  }

  const err = new Error('No registered provider or merchant entity found for this account');
  err.statusCode = 404;
  throw err;
}

/**
 * Create a new service starting in 'draft' status
 */
async function createService({
  ownerUserId,
  title,
  shortDescription = null,
  description = null,
  categoryId = null,
  category = null,
  priceAmount,
  currency = 'ETB',
  durationMinutes = 60,
  capacity = 1,
  leadTimeHours = 0,
  locationType = 'on_site',
  city = 'Addis Ababa',
  area = null,
  cancellationNote = null,
  tags = []
}) {
  if (!title || !title.trim()) {
    const err = new Error('Service title is required');
    err.statusCode = 400;
    throw err;
  }

  const numPrice = Number(priceAmount);
  if (isNaN(numPrice) || numPrice <= 0) {
    const err = new Error('Service price must be a valid number greater than zero');
    err.statusCode = 400;
    throw err;
  }

  const numDuration = parseInt(durationMinutes, 10);
  if (isNaN(numDuration) || numDuration <= 0) {
    const err = new Error('Duration minutes must be greater than zero');
    err.statusCode = 400;
    throw err;
  }

  const numCapacity = parseInt(capacity, 10) || 1;
  if (numCapacity < 1) {
    const err = new Error('Capacity must be at least 1 customer');
    err.statusCode = 400;
    throw err;
  }

  const numLeadTime = parseInt(leadTimeHours, 10) || 0;
  if (numLeadTime < 0) {
    const err = new Error('Lead time hours cannot be negative');
    err.statusCode = 400;
    throw err;
  }

  if (!ALLOWED_LOCATION_TYPES.includes(locationType)) {
    const err = new Error(`Invalid location type. Must be one of: ${ALLOWED_LOCATION_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Ensure owner is verified & approved
  const owner = await resolveApprovedOwner(ownerUserId);

  // Validate category if provided
  let catId = categoryId;
  let catLegacy = category;
  if (catId) {
    const catCheck = await pool.query('SELECT id, slug FROM service_categories WHERE id = $1 AND is_active = TRUE', [catId]);
    if (catCheck.rows.length === 0) {
      const err = new Error('Selected category is invalid or deactivated');
      err.statusCode = 400;
      throw err;
    }
    catLegacy = catCheck.rows[0].slug;
  } else if (catLegacy) {
    const catCheck = await pool.query('SELECT id, slug FROM service_categories WHERE slug = $1 AND is_active = TRUE', [catLegacy]);
    if (catCheck.rows.length > 0) {
      catId = catCheck.rows[0].id;
    }
  }

  const slug = generateSlug(title);
  const cleanTags = normalizeTags(tags);

  const insertSql = `
    INSERT INTO services (
      owner_user_id,
      owner_type,
      provider_id,
      category_id,
      category,
      title,
      slug,
      short_description,
      description,
      price,
      price_amount,
      currency,
      duration_minutes,
      capacity,
      lead_time_hours,
      location_type,
      city,
      area,
      cancellation_note,
      tags,
      status,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'draft', TRUE)
    RETURNING *
  `;

  const values = [
    ownerUserId,
    owner.owner_type,
    owner.owner_type === 'provider' ? owner.id : null,
    catId,
    catLegacy,
    title.trim(),
    slug,
    shortDescription ? shortDescription.trim().slice(0, 300) : null,
    description ? description.trim() : null,
    numPrice,
    numPrice,
    currency || 'ETB',
    numDuration,
    numCapacity,
    numLeadTime,
    locationType,
    city ? city.trim() : 'Addis Ababa',
    area ? area.trim() : null,
    cancellationNote ? cancellationNote.trim() : null,
    cleanTags
  ];

  const { rows } = await pool.query(insertSql, values);
  const created = rows[0];

  // Record initial creation in status history
  await pool.query(
    `INSERT INTO service_status_history (service_id, from_status, to_status, actor_user_id, reason)
     VALUES ($1, NULL, 'draft', $2, 'Initial draft created')`,
    [created.id, ownerUserId]
  );

  return created;
}

/**
 * Update service offering with sensitive field moderation trigger
 */
async function updateService({ serviceId, ownerUserId, updates, client = null }) {
  const db = client || pool;

  const sRes = await db.query('SELECT * FROM services WHERE id = $1', [serviceId]);
  if (sRes.rows.length === 0) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  const current = sRes.rows[0];

  if (current.owner_user_id !== ownerUserId) {
    const err = new Error('Unauthorized: You do not own this service listing');
    err.statusCode = 403;
    throw err;
  }

  if (current.status === 'archived') {
    const err = new Error('Archived services cannot be edited');
    err.statusCode = 400;
    throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;
  let sensitiveChange = false;

  if (updates.title !== undefined) {
    if (!updates.title || !updates.title.trim()) {
      const err = new Error('Service title cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`title = $${idx++}`);
    values.push(updates.title.trim());
    fields.push(`slug = $${idx++}`);
    values.push(generateSlug(updates.title));
    sensitiveChange = true;
  }

  if (updates.shortDescription !== undefined) {
    fields.push(`short_description = $${idx++}`);
    values.push(updates.shortDescription ? updates.shortDescription.trim().slice(0, 300) : null);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description ? updates.description.trim() : null);
  }

  if (updates.priceAmount !== undefined) {
    const p = Number(updates.priceAmount);
    if (isNaN(p) || p <= 0) {
      const err = new Error('Price must be greater than zero');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`price = $${idx++}`);
    values.push(p);
    fields.push(`price_amount = $${idx++}`);
    values.push(p);
    sensitiveChange = true;
  }

  if (updates.categoryId !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(updates.categoryId);
    sensitiveChange = true;
  }

  if (updates.durationMinutes !== undefined) {
    const d = parseInt(updates.durationMinutes, 10);
    if (isNaN(d) || d <= 0) {
      const err = new Error('Duration minutes must be positive');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`duration_minutes = $${idx++}`);
    values.push(d);
  }

  if (updates.capacity !== undefined) {
    const c = parseInt(updates.capacity, 10);
    if (isNaN(c) || c < 1) {
      const err = new Error('Capacity must be at least 1');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`capacity = $${idx++}`);
    values.push(c);
  }

  if (updates.leadTimeHours !== undefined) {
    const l = parseInt(updates.leadTimeHours, 10);
    if (isNaN(l) || l < 0) {
      const err = new Error('Lead time cannot be negative');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`lead_time_hours = $${idx++}`);
    values.push(l);
  }

  if (updates.locationType !== undefined) {
    if (!ALLOWED_LOCATION_TYPES.includes(updates.locationType)) {
      const err = new Error(`Invalid location type: ${updates.locationType}`);
      err.statusCode = 400;
      throw err;
    }
    fields.push(`location_type = $${idx++}`);
    values.push(updates.locationType);
  }

  if (updates.city !== undefined) {
    fields.push(`city = $${idx++}`);
    values.push(updates.city ? updates.city.trim() : null);
  }

  if (updates.area !== undefined) {
    fields.push(`area = $${idx++}`);
    values.push(updates.area ? updates.area.trim() : null);
  }

  if (updates.cancellationNote !== undefined) {
    fields.push(`cancellation_note = $${idx++}`);
    values.push(updates.cancellationNote ? updates.cancellationNote.trim() : null);
  }

  if (updates.tags !== undefined) {
    fields.push(`tags = $${idx++}`);
    values.push(normalizeTags(updates.tags));
  }

  if (fields.length === 0) {
    return current;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(serviceId);

  const updateSql = `
    UPDATE services
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `;
  const { rows } = await db.query(updateSql, values);
  let updated = rows[0];

  // If published and sensitive fields were edited, revert to pending_review per moderation rules
  if (current.status === 'published' && sensitiveChange) {
    updated = await transitionServiceStatus({
      serviceId,
      toStatus: 'pending_review',
      actorUserId: ownerUserId,
      reason: 'Sensitive field edit triggered re-moderation',
      dbClient: db
    });
  }

  return updated;
}

/**
 * Link an uploaded image to a service (max 8 images)
 */
async function linkServiceImage({
  serviceId,
  ownerUserId,
  uploadId = null,
  imageUrl = null,
  sortOrder = 0,
  isCover = false,
  altText = null
}) {
  const sRes = await pool.query('SELECT owner_user_id FROM services WHERE id = $1', [serviceId]);
  if (sRes.rows.length === 0) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  if (sRes.rows[0].owner_user_id !== ownerUserId) {
    const err = new Error('Unauthorized: You do not own this service listing');
    err.statusCode = 403;
    throw err;
  }

  // Enforce max 8 images cap
  const countRes = await pool.query('SELECT COUNT(*) AS total FROM service_images WHERE service_id = $1', [serviceId]);
  if (parseInt(countRes.rows[0].total, 10) >= 8) {
    const err = new Error('A service can have at most 8 gallery images');
    err.statusCode = 400;
    throw err;
  }

  // If designated as cover, clear cover flag on existing images
  if (isCover) {
    await pool.query('UPDATE service_images SET is_cover = FALSE WHERE service_id = $1', [serviceId]);
  }

  const insertSql = `
    INSERT INTO service_images (service_id, upload_id, image_url, sort_order, is_cover, alt_text)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await pool.query(insertSql, [
    serviceId,
    uploadId,
    imageUrl,
    parseInt(sortOrder, 10) || 0,
    Boolean(isCover),
    altText ? altText.trim().slice(0, 255) : null
  ]);

  return rows[0];
}

/**
 * Remove an image link from a service
 */
async function unlinkServiceImage({ serviceId, ownerUserId, imageId }) {
  const sRes = await pool.query('SELECT owner_user_id FROM services WHERE id = $1', [serviceId]);
  if (sRes.rows.length === 0) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  if (sRes.rows[0].owner_user_id !== ownerUserId) {
    const err = new Error('Unauthorized: You do not own this service listing');
    err.statusCode = 403;
    throw err;
  }

  await pool.query('DELETE FROM service_images WHERE id = $1 AND service_id = $2', [imageId, serviceId]);
  return { success: true, message: 'Image unlinked from service' };
}

/**
 * Public catalog query builder (strictly published offerings)
 */
async function getPublicCatalog({
  search = null,
  categoryId = null,
  minPrice = null,
  maxPrice = null,
  locationType = null,
  city = null,
  area = null,
  minDuration = null,
  maxDuration = null,
  sort = 'newest',
  page = 1,
  limit = 20
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(60, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ["s.status = 'published'", "s.is_active = TRUE"];
  const params = [];
  let idx = 1;

  if (search && search.trim()) {
    const term = search.trim();
    conditions.push(`(
      s.title ILIKE $${idx} OR
      s.short_description ILIKE $${idx} OR
      $${idx + 1} = ANY(s.tags)
    )`);
    params.push(`%${term}%`, term.toLowerCase());
    idx += 2;
  }

  if (categoryId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
    if (isUuid) {
      conditions.push(`(s.category_id = $${idx} OR sc.parent_id = $${idx})`);
      params.push(categoryId);
      idx++;
    } else {
      conditions.push(`(sc.slug = $${idx} OR EXISTS (SELECT 1 FROM service_categories pcat WHERE pcat.id = sc.parent_id AND pcat.slug = $${idx}))`);
      params.push(categoryId);
      idx++;
    }
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    const minP = Number(minPrice);
    if (!isNaN(minP)) {
      conditions.push(`s.price_amount >= $${idx++}`);
      params.push(minP);
    }
  }

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    const maxP = Number(maxPrice);
    if (!isNaN(maxP)) {
      conditions.push(`s.price_amount <= $${idx++}`);
      params.push(maxP);
    }
  }

  if (locationType && ALLOWED_LOCATION_TYPES.includes(locationType)) {
    conditions.push(`s.location_type = $${idx++}`);
    params.push(locationType);
  }

  if (city && city.trim()) {
    conditions.push(`s.city ILIKE $${idx++}`);
    params.push(`%${city.trim()}%`);
  }

  if (area && area.trim()) {
    conditions.push(`s.area ILIKE $${idx++}`);
    params.push(`%${area.trim()}%`);
  }

  if (minDuration) {
    const md = parseInt(minDuration, 10);
    if (!isNaN(md)) {
      conditions.push(`s.duration_minutes >= $${idx++}`);
      params.push(md);
    }
  }

  if (maxDuration) {
    const xd = parseInt(maxDuration, 10);
    if (!isNaN(xd)) {
      conditions.push(`s.duration_minutes <= $${idx++}`);
      params.push(xd);
    }
  }

  let orderBy = 's.published_at DESC NULLS LAST, s.created_at DESC';
  if (sort === 'price_asc') {
    orderBy = 's.price_amount ASC';
  } else if (sort === 'price_desc') {
    orderBy = 's.price_amount DESC';
  } else if (sort === 'relevance' && search && search.trim()) {
    orderBy = `similarity(s.title, $${idx}) DESC`;
    params.push(search.trim());
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    ${whereClause}
  `;
  const countRes = await pool.query(countSql, params.slice(0, idx - (sort === 'relevance' && search && search.trim() ? 1 : 0)));
  const total = parseInt(countRes.rows[0].total, 10);

  const dataSql = `
    SELECT 
      s.id,
      s.title,
      s.slug,
      s.short_description,
      s.price_amount,
      s.currency,
      s.duration_minutes,
      s.capacity,
      s.lead_time_hours,
      s.location_type,
      s.city,
      s.area,
      s.tags,
      s.published_at,
      s.owner_type,
      sc.name AS category_name,
      sc.slug AS category_slug,
      COALESCE(cov.image_url, s.image_url) AS cover_image_url,
      cov.alt_text AS cover_image_alt,
      COALESCE(p.provider_name, m.business_name, 'Verified Provider') AS owner_name,
      COALESCE(p.official_phone, m.business_phone) AS owner_phone
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN service_images cov ON cov.service_id = s.id AND cov.is_cover = TRUE
    LEFT JOIN providers p ON s.owner_user_id = p.user_id
    LEFT JOIN merchants m ON s.owner_user_id = m.user_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  params.push(limitNum, offset);
  const { rows } = await pool.query(dataSql, params);

  return {
    services: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Public single service details by slug (published only)
 */
async function getPublicServiceBySlug(slug) {
  const sql = `
    SELECT 
      s.id,
      s.owner_user_id,
      s.owner_type,
      s.title,
      s.slug,
      s.short_description,
      s.description,
      s.price_amount,
      s.currency,
      s.duration_minutes,
      s.capacity,
      s.lead_time_hours,
      s.location_type,
      s.city,
      s.area,
      s.cancellation_note,
      s.tags,
      s.published_at,
      sc.id AS category_id,
      sc.name AS category_name,
      sc.slug AS category_slug,
      COALESCE(p.provider_name, m.business_name, 'Verified Provider') AS owner_name,
      COALESCE(p.official_phone, m.business_phone) AS owner_phone,
      COALESCE(p.official_email, m.business_email) AS owner_email,
      p.operating_hours AS operating_hours,
      p.provider_type,
      m.business_type
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN providers p ON s.owner_user_id = p.user_id
    LEFT JOIN merchants m ON s.owner_user_id = m.user_id
    WHERE (s.slug = $1 OR s.id::text = $1) AND s.status = 'published' AND s.is_active = TRUE
  `;

  const { rows } = await pool.query(sql, [slug]);
  if (rows.length === 0) {
    const err = new Error('Service offering not found or is currently not published');
    err.statusCode = 404;
    throw err;
  }
  const service = rows[0];

  // Fetch gallery images
  const imagesRes = await pool.query(
    `SELECT id, image_url, sort_order, is_cover, alt_text
     FROM service_images
     WHERE service_id = $1
     ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
    [service.id]
  );

  return {
    ...service,
    gallery: imagesRes.rows
  };
}

/**
 * Get authored services for authenticated owner
 */
async function getOwnerServices({ ownerUserId, status = null, page = 1, limit = 50 }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['s.owner_user_id = $1'];
  const params = [ownerUserId];
  let idx = 2;

  if (status && SERVICE_STATES.includes(status)) {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) AS total FROM services s ${whereClause}`;
  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataSql = `
    SELECT 
      s.*,
      sc.name AS category_name,
      COUNT(DISTINCT img.id)::int AS image_count,
      MAX(CASE WHEN img.is_cover THEN img.image_url ELSE NULL END) AS cover_image_url
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN service_images img ON img.service_id = s.id
    ${whereClause}
    GROUP BY s.id, sc.name
    ORDER BY s.updated_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  params.push(limitNum, offset);
  const { rows } = await pool.query(dataSql, params);

  return {
    services: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Get administrative moderation review queue
 */
async function getAdminReviewQueue({ status = 'pending_review', page = 1, limit = 50 }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (status && SERVICE_STATES.includes(status)) {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM services s ${whereClause}`;
  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataSql = `
    SELECT 
      s.*,
      sc.name AS category_name,
      COALESCE(p.provider_name, m.business_name, u.full_name) AS owner_name,
      u.email AS owner_email,
      COUNT(DISTINCT img.id)::int AS image_count
    FROM services s
    JOIN users u ON s.owner_user_id = u.id
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN providers p ON s.owner_user_id = p.user_id
    LEFT JOIN merchants m ON s.owner_user_id = m.user_id
    LEFT JOIN service_images img ON img.service_id = s.id
    ${whereClause}
    GROUP BY s.id, sc.name, p.provider_name, m.business_name, u.full_name, u.email
    ORDER BY s.updated_at ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  params.push(limitNum, offset);
  const { rows } = await pool.query(dataSql, params);

  return {
    services: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Public Categories taxonomy tree
 */
async function getCategoryTaxonomy() {
  const { rows } = await pool.query(
    `SELECT id, parent_id, name, slug, sort_order, is_active
     FROM service_categories
     WHERE is_active = TRUE
     ORDER BY sort_order ASC, name ASC`
  );

  const topLevel = rows.filter(r => !r.parent_id);
  const byParent = {};
  for (const r of rows) {
    if (r.parent_id) {
      if (!byParent[r.parent_id]) byParent[r.parent_id] = [];
      byParent[r.parent_id].push(r);
    }
  }

  return topLevel.map(cat => ({
    ...cat,
    subcategories: byParent[cat.id] || []
  }));
}

/**
 * Public Categories taxonomy with published service counts
 */
async function getCategoriesWithCounts() {
  const { rows } = await pool.query(
    `SELECT 
       sc.id, sc.parent_id, sc.name, sc.slug, sc.sort_order, sc.is_active,
       COUNT(DISTINCT s.id)::int AS service_count
     FROM service_categories sc
     LEFT JOIN services s ON (s.category_id = sc.id OR s.category_id IN (SELECT child.id FROM service_categories child WHERE child.parent_id = sc.id)) 
                          AND s.status = 'published' AND s.is_active = TRUE
     WHERE sc.is_active = TRUE
     GROUP BY sc.id, sc.parent_id, sc.name, sc.slug, sc.sort_order, sc.is_active
     ORDER BY sc.sort_order ASC, sc.name ASC`
  );

  const topLevel = rows.filter(r => !r.parent_id);
  const byParent = {};
  for (const r of rows) {
    if (r.parent_id) {
      if (!byParent[r.parent_id]) byParent[r.parent_id] = [];
      byParent[r.parent_id].push(r);
    }
  }

  return topLevel.map(cat => ({
    ...cat,
    subcategories: byParent[cat.id] || []
  }));
}

/**
 * Public Providers directory with published counts
 */
async function getProvidersDirectory({ category = null, search = null, city = null, page = 1, limit = 20 }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ["p.approval_status = 'approved'"];
  const params = [];
  let idx = 1;

  if (category && category.trim()) {
    conditions.push(`p.provider_type = $${idx++}`);
    params.push(category.trim());
  }
  if (search && search.trim()) {
    conditions.push(`(p.provider_name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countSql = `SELECT COUNT(*) AS total FROM providers p ${whereClause}`;
  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataSql = `
    SELECT 
      p.id,
      p.user_id,
      p.provider_name,
      p.provider_type,
      p.service_category,
      p.official_phone,
      p.official_email,
      p.website,
      p.description,
      p.operating_hours,
      p.availability,
      COUNT(DISTINCT s.id)::int AS published_services_count
    FROM providers p
    LEFT JOIN services s ON s.owner_user_id = p.user_id AND s.status = 'published' AND s.is_active = TRUE
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.provider_name ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limitNum, offset);
  const { rows } = await pool.query(dataSql, params);

  return {
    providers: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

module.exports = {
  SERVICE_STATES,
  ALLOWED_TRANSITIONS,
  ALLOWED_LOCATION_TYPES,
  generateSlug,
  normalizeTags,
  transitionServiceStatus,
  resolveApprovedOwner,
  createService,
  updateService,
  linkServiceImage,
  unlinkServiceImage,
  getPublicCatalog,
  getPublicServiceBySlug,
  getOwnerServices,
  getAdminReviewQueue,
  getCategoryTaxonomy,
  getCategoriesWithCounts,
  getProvidersDirectory
};
