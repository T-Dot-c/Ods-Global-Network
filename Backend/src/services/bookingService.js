/**
 * ODS Global Network — Booking Service (Batch 9)
 *
 * Implements:
 * 1. Provider availability rules & exceptions management
 * 2. Dynamic on-demand slot generation engine (UTC conversion, lead time, multi-capacity checks)
 * 3. Concurrency-safe booking creation with PostgreSQL advisory transaction locks
 * 4. 10-minute hold management and dual expiration engine
 * 5. 7-state booking lifecycle with append-only status history ledger
 * 6. Payment integration (Chapa verification & gift card redemption)
 * 7. Cancellation policy engine with refund calculation & atomic slot rescheduling
 */
'use strict';

const crypto = require('crypto');
const pool = require('../db');
const { notify } = require('./notificationService');
const { cancelPendingBookingReminders } = require('./notificationScheduler');
const { formatEthiopianDate } = require('./notificationTemplateService');

const BOOKING_HOLD_MINUTES = parseInt(process.env.BOOKING_HOLD_MINUTES || '10', 10);
const DEFAULT_TIMEZONE = 'Africa/Addis_Ababa';

const ALLOWED_TRANSITIONS = {
  pending_payment: ['confirmed', 'awaiting_provider', 'expired', 'cancelled_by_customer', 'payment_conflict'],
  awaiting_provider: ['confirmed', 'declined', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin'],
  confirmed: ['completed', 'no_show', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'confirmed'], // 'confirmed' allowed for rescheduling
  payment_conflict: ['cancelled_by_admin'],
  expired: [],
  completed: [],
  no_show: [],
  declined: [],
  cancelled_by_customer: [],
  cancelled_by_provider: [],
  cancelled_by_admin: [],
};

/**
 * Generates human-readable booking reference (e.g. ODS-BK-001234)
 */
function generateBookingReference() {
  const tsPart = Date.now().toString().slice(-6);
  const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ODS-BK-${tsPart}${randPart}`;
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 1: Availability Rules & Exceptions
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Retrieves weekly recurring availability rules for a provider/merchant
 */
async function getWeeklyAvailability(providerUserId, serviceId = null) {
  let query = `
    SELECT id, provider_user_id, service_id, weekday, start_time, end_time, time_zone, is_active
    FROM provider_availability_rules
    WHERE provider_user_id = $1
  `;
  const params = [providerUserId];

  if (serviceId) {
    query += ` AND (service_id = $2 OR service_id IS NULL) ORDER BY service_id NULLS LAST, weekday, start_time`;
    params.push(serviceId);
  } else {
    query += ` AND service_id IS NULL ORDER BY weekday, start_time`;
  }

  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Sets weekly recurring availability rules (replaces existing rules for provider/service)
 */
async function setWeeklyAvailability(providerUserId, rules, serviceId = null) {
  if (!Array.isArray(rules)) {
    throw new Error('Rules must be an array of schedule items.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove existing rules for provider and target service
    if (serviceId) {
      await client.query(
        `DELETE FROM provider_availability_rules WHERE provider_user_id = $1 AND service_id = $2`,
        [providerUserId, serviceId]
      );
    } else {
      await client.query(
        `DELETE FROM provider_availability_rules WHERE provider_user_id = $1 AND service_id IS NULL`,
        [providerUserId]
      );
    }

    const inserted = [];
    for (const rule of rules) {
      const weekday = parseInt(rule.weekday, 10);
      if (isNaN(weekday) || weekday < 0 || weekday > 6) {
        throw new Error(`Invalid weekday ${rule.weekday}. Must be 0 (Sunday) through 6 (Saturday).`);
      }

      const startTime = String(rule.start_time || '').trim();
      const endTime = String(rule.end_time || '').trim();
      if (!startTime || !endTime) {
        throw new Error('Start time and end time are required.');
      }

      if (endTime <= startTime) {
        throw new Error(`End time (${endTime}) must be after start time (${startTime}).`);
      }

      const tz = rule.time_zone || DEFAULT_TIMEZONE;
      const isActive = rule.is_active !== false;

      const insRes = await client.query(
        `INSERT INTO provider_availability_rules
         (provider_user_id, service_id, weekday, start_time, end_time, time_zone, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [providerUserId, serviceId || null, weekday, startTime, endTime, tz, isActive]
      );
      inserted.push(insRes.rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieves blackout dates & custom hour exceptions
 */
async function getAvailabilityExceptions(providerUserId, serviceId = null) {
  let query = `
    SELECT id, provider_user_id, service_id, exception_date, is_closed, start_time, end_time, note, created_at
    FROM provider_availability_exceptions
    WHERE provider_user_id = $1
  `;
  const params = [providerUserId];

  if (serviceId) {
    query += ` AND (service_id = $2 OR service_id IS NULL)`;
    params.push(serviceId);
  }

  query += ` ORDER BY exception_date ASC`;
  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Adds an availability exception (blackout or custom date hours)
 */
async function addAvailabilityException(providerUserId, data) {
  const { service_id = null, exception_date, is_closed = true, start_time = null, end_time = null, note = null } = data;

  if (!exception_date) {
    throw new Error('exception_date is required.');
  }

  const isClosed = Boolean(is_closed);
  if (!isClosed) {
    if (!start_time || !end_time) {
      throw new Error('start_time and end_time are required when is_closed is false.');
    }
    if (end_time <= start_time) {
      throw new Error('end_time must be after start_time.');
    }
  }

  const res = await pool.query(
    `INSERT INTO provider_availability_exceptions
     (provider_user_id, service_id, exception_date, is_closed, start_time, end_time, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [providerUserId, service_id || null, exception_date, isClosed, start_time || null, end_time || null, note || null]
  );

  return res.rows[0];
}

/**
 * Deletes an availability exception
 */
async function deleteAvailabilityException(providerUserId, exceptionId) {
  const res = await pool.query(
    `DELETE FROM provider_availability_exceptions
     WHERE id = $1 AND provider_user_id = $2
     RETURNING id`,
    [exceptionId, providerUserId]
  );

  if (res.rowCount === 0) {
    throw new Error('Exception not found or access denied.');
  }
  return true;
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 2: Dynamic Slot Generation Engine
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Computes open appointment slots for a given service within a date range
 */
async function getAvailableSlots({ serviceId, fromDate, toDate }) {
  // 1. Fetch service details
  const svcRes = await pool.query(
    `SELECT s.id, s.title, s.duration_minutes, s.capacity, s.lead_time_hours,
            s.price_amount, s.currency, s.location_type, s.status, s.owner_user_id,
            p.provider_name, m.business_name
     FROM services s
     LEFT JOIN providers p ON s.owner_user_id = p.user_id
     LEFT JOIN merchants m ON s.owner_user_id = m.user_id
     WHERE s.id = $1`,
    [serviceId]
  );

  if (svcRes.rows.length === 0) {
    throw new Error('Service not found.');
  }

  const service = svcRes.rows[0];
  if (!['published', 'approved'].includes(service.status)) {
    throw new Error('Service is not currently published for booking.');
  }

  const durationMinutes = parseInt(service.duration_minutes || '60', 10);
  const capacity = parseInt(service.capacity || '1', 10);
  const leadTimeHours = parseInt(service.lead_time_hours || '2', 10);
  const providerUserId = service.owner_user_id;

  // 2. Clamp date range: today to max 60 days ahead
  const now = new Date();
  const minStart = new Date(now.getTime() + leadTimeHours * 3600 * 1000);

  let startRange = fromDate ? new Date(fromDate) : new Date();
  if (isNaN(startRange.getTime()) || startRange < now) {
    startRange = new Date();
  }

  const maxAllowedDate = new Date(now.getTime() + 60 * 24 * 3600 * 1000);
  let endRange = toDate ? new Date(toDate) : new Date(startRange.getTime() + 14 * 24 * 3600 * 1000);
  if (isNaN(endRange.getTime()) || endRange > maxAllowedDate) {
    endRange = maxAllowedDate;
  }
  if (endRange < startRange) {
    endRange = new Date(startRange.getTime() + 7 * 24 * 3600 * 1000);
  }

  // 3. Fetch availability rules (service override first, then provider default)
  let rules = await getWeeklyAvailability(providerUserId, serviceId);
  if (rules.length === 0) {
    // Fallback to default business hours if provider hasn't configured custom rules
    rules = [
      { weekday: 1, start_time: '09:00:00', end_time: '17:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
      { weekday: 2, start_time: '09:00:00', end_time: '17:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
      { weekday: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
      { weekday: 4, start_time: '09:00:00', end_time: '17:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
      { weekday: 5, start_time: '09:00:00', end_time: '17:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
      { weekday: 6, start_time: '09:00:00', end_time: '14:00:00', is_active: true, time_zone: DEFAULT_TIMEZONE },
    ];
  }

  // 4. Fetch exceptions
  const exceptions = await getAvailabilityExceptions(providerUserId, serviceId);
  const exceptionMap = new Map();
  for (const ex of exceptions) {
    const dStr = new Date(ex.exception_date).toISOString().slice(0, 10);
    exceptionMap.set(dStr, ex);
  }

  // 5. Fetch existing active bookings and active holds in range
  const existingRes = await pool.query(
    `SELECT start_at, COUNT(*) as booked_count
     FROM bookings
     WHERE service_id = $1
       AND start_at >= $2
       AND start_at <= $3
       AND status IN ('confirmed', 'awaiting_provider', 'pending_payment')
       AND (status != 'pending_payment' OR hold_expires_at > NOW())
     GROUP BY start_at`,
    [serviceId, startRange.toISOString(), endRange.toISOString()]
  );

  const bookedCounts = new Map();
  for (const row of existingRes.rows) {
    const k = new Date(row.start_at).toISOString();
    bookedCounts.set(k, parseInt(row.booked_count, 10));
  }

  // 6. Generate slots day by day
  const slots = [];
  const currDay = new Date(startRange);
  currDay.setUTCHours(0, 0, 0, 0);

  const endDay = new Date(endRange);
  endDay.setUTCHours(23, 59, 59, 999);

  while (currDay <= endDay) {
    const dateStr = currDay.toISOString().slice(0, 10);
    const dayOfWeek = currDay.getUTCDay();

    // Check exceptions
    const ex = exceptionMap.get(dateStr);
    let dayRules = [];

    if (ex) {
      if (!ex.is_closed && ex.start_time && ex.end_time) {
        dayRules = [{ start_time: ex.start_time, end_time: ex.end_time }];
      }
      // If ex.is_closed is true, dayRules remains empty (blackout day)
    } else {
      dayRules = rules.filter(r => r.weekday === dayOfWeek && r.is_active);
    }

    for (const rule of dayRules) {
      // Parse shift times (assume Africa/Addis_Ababa is UTC+3)
      const [sH, sM] = (rule.start_time || '09:00:00').split(':').map(Number);
      const [eH, eM] = (rule.end_time || '17:00:00').split(':').map(Number);

      // Construct UTC instants for this day
      // EAT is UTC+3 (standard throughout the year, no DST)
      const slotCursor = new Date(Date.UTC(currDay.getUTCFullYear(), currDay.getUTCMonth(), currDay.getUTCDate(), sH - 3, sM, 0));
      const shiftEnd = new Date(Date.UTC(currDay.getUTCFullYear(), currDay.getUTCMonth(), currDay.getUTCDate(), eH - 3, eM, 0));

      while (new Date(slotCursor.getTime() + durationMinutes * 60000) <= shiftEnd) {
        const slotStart = new Date(slotCursor);
        const slotEnd = new Date(slotCursor.getTime() + durationMinutes * 60000);

        // Advance cursor for next iteration
        slotCursor.setTime(slotCursor.getTime() + durationMinutes * 60000);

        // Lead time check: must be at least leadTimeHours in the future
        if (slotStart <= minStart) {
          continue;
        }

        const slotKey = slotStart.toISOString();
        const occupied = bookedCounts.get(slotKey) || 0;
        const available = capacity - occupied;

        if (available > 0) {
          slots.push({
            start_at: slotStart.toISOString(),
            end_at: slotEnd.toISOString(),
            available_capacity: available,
            total_capacity: capacity,
          });
        }
      }
    }

    // Advance to next day
    currDay.setUTCDate(currDay.getUTCDate() + 1);
  }

  return {
    service_id: service.id,
    service_title: service.title,
    duration_minutes: durationMinutes,
    price_amount: service.price_amount,
    currency: service.currency,
    location_type: service.location_type,
    time_zone: DEFAULT_TIMEZONE,
    slots,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 3: Booking Creation, Advisory Locks & Holds
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Creates a pending booking with a 10-minute hold using PostgreSQL advisory transaction locks
 */
async function createBookingHold({ serviceId, startAt, customerUserId, contactPhone, customerNote }) {
  if (!serviceId || !startAt) {
    throw new Error('serviceId and startAt are required.');
  }

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime()) || startDate <= new Date()) {
    throw new Error('Appointment start time must be a valid future date.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch published service
    const svcRes = await client.query(
      `SELECT s.id, s.title, s.duration_minutes, s.capacity, s.lead_time_hours,
              s.price_amount, s.currency, s.location_type, s.status, s.owner_user_id,
              s.cancellation_note
       FROM services s
       WHERE s.id = $1`,
      [serviceId]
    );

    if (svcRes.rows.length === 0) {
      throw new Error('Service not found.');
    }

    const service = svcRes.rows[0];
    if (!['published', 'approved'].includes(service.status)) {
      throw new Error('This service is not available for booking.');
    }

    const providerUserId = service.owner_user_id;
    const durationMinutes = parseInt(service.duration_minutes || '60', 10);
    const capacity = parseInt(service.capacity || '1', 10);
    const leadTimeHours = parseInt(service.lead_time_hours || '2', 10);

    const minNotice = new Date(Date.now() + leadTimeHours * 3600 * 1000);
    if (startDate < minNotice) {
      throw new Error(`This service requires at least ${leadTimeHours} hour(s) advance booking notice.`);
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // 2. Concurrency Guarantee: Acquire PostgreSQL Advisory Transaction Lock on (providerUserId + startAt)
    // This serializes all parallel booking attempts for this exact provider slot
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1))`,
      [`booking_${providerUserId}_${startDate.toISOString()}`]
    );

    // 3. Count active reservations and active holds for this slot
    const countRes = await client.query(
      `SELECT COUNT(*) as active_count
       FROM bookings
       WHERE provider_user_id = $1
         AND start_at = $2
         AND status IN ('confirmed', 'awaiting_provider', 'pending_payment')
         AND (status != 'pending_payment' OR hold_expires_at > NOW())`,
      [providerUserId, startDate.toISOString()]
    );

    const activeCount = parseInt(countRes.rows[0].active_count, 10);
    if (activeCount >= capacity) {
      const err = new Error('Selected time slot is no longer available. Please select another time.');
      err.status = 409;
      throw err;
    }

    // 4. Check for user pending hold spam cap (max 5 simultaneous active holds per customer)
    const holdCountRes = await client.query(
      `SELECT COUNT(*) as user_holds
       FROM bookings
       WHERE customer_user_id = $1
         AND status = 'pending_payment'
         AND hold_expires_at > NOW()`,
      [customerUserId]
    );
    if (parseInt(holdCountRes.rows[0].user_holds, 10) >= 5) {
      const err = new Error('You have multiple pending booking checkouts active. Please complete or wait for them to expire.');
      err.status = 429;
      throw err;
    }

    // 5. Snapshots
    const serviceSnapshot = {
      id: service.id,
      title: service.title,
      duration_minutes: durationMinutes,
      price: service.price_amount,
      currency: service.currency,
      location_type: service.location_type,
    };

    const cancellationSnapshot = {
      preset: 'flexible',
      description: service.cancellation_note || 'Full refund up to 24 hours before appointment, 50% up to 6 hours before, no refund afterwards.',
      full_refund_hours: 24,
      partial_refund_hours: 6,
      partial_refund_percent: 50,
    };

    const reference = generateBookingReference();
    const holdExpiresAt = new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000);

    // 6. Insert booking
    const insertRes = await client.query(
      `INSERT INTO bookings
       (reference, service_id, customer_user_id, provider_user_id, start_at, end_at,
        status, hold_expires_at, price_amount, currency, contact_phone, customer_note,
        service_snapshot, cancellation_policy_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending_payment', $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        reference,
        service.id,
        customerUserId,
        providerUserId,
        startDate.toISOString(),
        endDate.toISOString(),
        holdExpiresAt.toISOString(),
        service.price_amount,
        service.currency || 'ETB',
        contactPhone || null,
        customerNote || null,
        JSON.stringify(serviceSnapshot),
        JSON.stringify(cancellationSnapshot),
      ]
    );

    const booking = insertRes.rows[0];

    // 7. Write to append-only status history ledger
    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, NULL, 'pending_payment', $2, $3)`,
      [booking.id, customerUserId, `Booking created with ${BOOKING_HOLD_MINUTES}-minute checkout hold`]
    );

    // 8. Write to outbox
    await client.query(
      `INSERT INTO booking_outbox (booking_id, event_type, payload)
       VALUES ($1, 'booking.created', $2)`,
      [booking.id, JSON.stringify({ reference: booking.reference, hold_expires_at: holdExpiresAt })]
    );

    await client.query('COMMIT');

    return {
      booking,
      hold_expires_at: holdExpiresAt,
      hold_minutes: BOOKING_HOLD_MINUTES,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 4: Lifecycle State Machine & History Ledger
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Transitions a booking to a new state with strict transition validation and ledger recording
 */
async function transitionBookingStatus(bookingId, newStatus, actorUserId, reason = '', externalClient = null) {
  const client = externalClient || await pool.connect();
  const shouldManageTx = !externalClient;

  try {
    if (shouldManageTx) await client.query('BEGIN');

    const bookRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookRes.rows.length === 0) {
      throw new Error('Booking not found.');
    }

    const booking = bookRes.rows[0];
    const currentStatus = booking.status;

    // Check allowed transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      const err = new Error(`Illegal booking status transition from '${currentStatus}' to '${newStatus}'.`);
      err.status = 400;
      throw err;
    }

    // Update status
    const updRes = await client.query(
      `UPDATE bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newStatus, bookingId]
    );

    const updatedBooking = updRes.rows[0];

    // Record immutable audit history
    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [bookingId, currentStatus, newStatus, actorUserId || null, reason || null]
    );

    // Record outbox event
    await client.query(
      `INSERT INTO booking_outbox (booking_id, event_type, payload)
       VALUES ($1, $2, $3)`,
      [bookingId, `booking.${newStatus}`, JSON.stringify({ reference: booking.reference, from: currentStatus, to: newStatus, reason })]
    );

    // ── Dispatch Notification Engine events (Batch 11) ─────────────────────────
    try {
      const detailsQuery = `
        SELECT b.id, b.reference, b.start_at, s.title as service_title,
               COALESCE(p.organization_name, 'Healthcare Provider') as provider_name,
               u_c.first_name as customer_name, u_c.email as customer_email,
               a.street, a.city
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        LEFT JOIN providers p ON p.id = b.provider_id
        LEFT JOIN users u_c ON u_c.id = b.customer_id
        LEFT JOIN addresses a ON a.id = b.address_id
        WHERE b.id = $1;
      `;
      const detRes = await client.query(detailsQuery, [bookingId]);
      if (detRes.rows.length > 0) {
        const det = detRes.rows[0];
        const appointmentTimeStr = formatEthiopianDate(det.start_at);
        const facilityAddress = [det.street, det.city].filter(Boolean).join(', ') || 'Provider Facility';

        if (newStatus === 'awaiting_provider') {
          await notify('booking.created_awaiting_provider', {
            customerName: det.customer_name || 'Customer',
            serviceTitle: det.service_title,
            providerName: det.provider_name,
            appointmentTime: appointmentTimeStr,
            reference: det.reference,
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);

          await notify('booking.provider_new_request', {
            providerName: det.provider_name,
            customerName: det.customer_name || 'Customer',
            serviceTitle: det.service_title,
            appointmentTime: appointmentTimeStr,
            targetRole: 'provider',
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);
        } else if (newStatus === 'confirmed') {
          await notify('booking.confirmed', {
            customerName: det.customer_name || 'Customer',
            providerName: det.provider_name,
            serviceTitle: det.service_title,
            appointmentTime: appointmentTimeStr,
            facilityAddress,
            reference: det.reference,
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);
        } else if (newStatus === 'declined') {
          await notify('booking.declined', {
            customerName: det.customer_name || 'Customer',
            providerName: det.provider_name,
            serviceTitle: det.service_title,
            declineReason: reason || 'Provider unavailable',
            reference: det.reference,
            targetRole: 'customer',
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);
        } else if (newStatus.startsWith('cancelled')) {
          await cancelPendingBookingReminders(bookingId, client);
          await notify('booking.cancelled', {
            recipientName: 'Valued Member',
            serviceTitle: det.service_title,
            appointmentTime: appointmentTimeStr,
            cancelledBy: newStatus.replace('cancelled_by_', ''),
            cancelReason: reason || 'Booking cancelled',
            reference: det.reference,
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);
        } else if (newStatus === 'completed') {
          await notify('booking.completed', {
            customerName: det.customer_name || 'Customer',
            providerName: det.provider_name,
            serviceTitle: det.service_title,
            appointmentTime: appointmentTimeStr,
            targetRole: 'customer',
          }, { subjectType: 'booking', subjectId: bookingId, actorUserId }, client);
        }
      }
    } catch (notifErr) {
      console.warn('[Booking Service] Notification dispatch warning:', notifErr.message);
    }

    if (shouldManageTx) await client.query('COMMIT');
    return updatedBooking;
  } catch (err) {
    if (shouldManageTx) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (shouldManageTx) client.release();
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 5: Payment Fulfillment (Chapa & Gift Card)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Confirms a booking after Chapa payment completion (handles late payment conflict)
 */
async function confirmPaidBooking(transaction) {
  const bookingId = transaction.metadata?.booking_id;
  if (!bookingId) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const booking = bRes.rows[0];

    // Idempotent: already confirmed
    if (booking.status === 'confirmed') {
      await client.query('ROLLBACK');
      return booking;
    }

    const now = new Date();
    const isHoldExpired = booking.hold_expires_at && new Date(booking.hold_expires_at) < now;

    if (isHoldExpired) {
      // Check if slot was taken while hold was lapsed
      const countRes = await client.query(
        `SELECT COUNT(*) as active_count
         FROM bookings
         WHERE provider_user_id = $1
           AND start_at = $2
           AND id != $3
           AND status IN ('confirmed', 'awaiting_provider')`,
        [booking.provider_user_id, booking.start_at, booking.id]
      );

      const capacity = booking.service_snapshot?.capacity || 1;
      const occupied = parseInt(countRes.rows[0].active_count, 10);

      if (occupied >= capacity) {
        // Slot taken! Mark payment conflict and trigger refund record
        await transitionBookingStatus(
          booking.id,
          'payment_conflict',
          null,
          'Payment arrived after hold expired and slot was already claimed by another customer. Full refund pending.',
          client
        );
        await client.query(
          `UPDATE bookings SET payment_transaction_id = $1, refund_amount = price_amount WHERE id = $2`,
          [transaction.id, booking.id]
        );
        await client.query('COMMIT');
        return booking;
      }
    }

    // Slot is free (or hold was still valid): Confirm booking
    await client.query(
      `UPDATE bookings
       SET payment_transaction_id = $1, status = 'confirmed', updated_at = NOW()
       WHERE id = $2`,
      [transaction.id, booking.id]
    );

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, 'confirmed', $3, $4)`,
      [booking.id, booking.status, transaction.user_id, `Payment confirmed via Chapa (${transaction.tx_ref})`]
    );

    await client.query(
      `INSERT INTO booking_outbox (booking_id, event_type, payload)
       VALUES ($1, 'booking.confirmed', $2)`,
      [booking.id, JSON.stringify({ reference: booking.reference, tx_ref: transaction.tx_ref })]
    );

    await client.query('COMMIT');
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Redeems an active Gift Card to pay for a booking atomically
 */
async function redeemGiftForBooking({ bookingId, giftCode, customerUserId }) {
  if (!giftCode) {
    throw new Error('Gift card code is required.');
  }

  const cleanCode = String(giftCode).trim().toUpperCase();
  const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch booking
    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) {
      throw new Error('Booking not found.');
    }

    const booking = bRes.rows[0];
    if (booking.customer_user_id !== customerUserId) {
      const err = new Error('Access denied to booking.');
      err.status = 403;
      throw err;
    }

    if (booking.status !== 'pending_payment') {
      throw new Error(`Cannot pay for booking with status '${booking.status}'.`);
    }

    if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
      throw new Error('Checkout hold has expired. Please select the slot again.');
    }

    // 2. Fetch and lock gift card
    const gRes = await client.query(
      `SELECT * FROM gift_cards WHERE code_hash = $1 FOR UPDATE`,
      [codeHash]
    );
    if (gRes.rows.length === 0) {
      throw new Error('Invalid gift card code.');
    }

    const gift = gRes.rows[0];
    if (gift.status !== 'active') {
      throw new Error(`Gift card is ${gift.status}.`);
    }

    if (new Date(gift.expiry_date) < new Date()) {
      throw new Error('Gift card has expired.');
    }

    const bookingPrice = parseFloat(booking.price_amount);
    const giftBalance = parseFloat(gift.balance);

    if (giftBalance < bookingPrice) {
      const err = new Error(`Gift card balance (${giftBalance} ${gift.currency}) is insufficient for service price (${bookingPrice} ${booking.currency}). Full-cover gift card required.`);
      err.status = 400;
      throw err;
    }

    // 3. Deduct gift card balance
    const newBalance = giftBalance - bookingPrice;
    const newGiftStatus = newBalance === 0 ? 'redeemed' : 'active';
    const redeemedAt = newBalance === 0 ? 'NOW()' : 'NULL';

    await client.query(
      `UPDATE gift_cards
       SET balance = $1, status = $2, redeemed_at = ${redeemedAt}
       WHERE id = $3`,
      [newBalance, newGiftStatus, gift.id]
    );

    // 4. Record redemption log
    await client.query(
      `INSERT INTO gift_card_redemptions (gift_card_id, user_id, amount, currency, balance_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [gift.id, customerUserId, bookingPrice, booking.currency, newBalance]
    );

    // 5. Update booking to confirmed
    await client.query(
      `UPDATE bookings
       SET gift_card_id = $1, status = 'confirmed', updated_at = NOW()
       WHERE id = $2`,
      [gift.id, booking.id]
    );

    // 6. Record history & outbox
    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, 'pending_payment', 'confirmed', $2, $3)`,
      [booking.id, customerUserId, `Paid in full via Gift Card ${cleanCode}`]
    );

    await client.query(
      `INSERT INTO booking_outbox (booking_id, event_type, payload)
       VALUES ($1, 'booking.confirmed', $2)`,
      [booking.id, JSON.stringify({ reference: booking.reference, payment_method: 'gift_card', gift_card_id: gift.id })]
    );

    await client.query('COMMIT');

    return {
      success: true,
      booking_id: booking.id,
      reference: booking.reference,
      status: 'confirmed',
      gift_balance_remaining: newBalance,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 6: Cancellation, Refund Computation & Rescheduling
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Computes refund amount based on structured cancellation policy
 */
function computeRefund(booking) {
  const policy = booking.cancellation_policy_snapshot || {};
  const fullHours = policy.full_refund_hours || 24;
  const partialHours = policy.partial_refund_hours || 6;
  const partialPct = policy.partial_refund_percent || 50;

  const now = Date.now();
  const start = new Date(booking.start_at).getTime();
  const hoursUntilStart = (start - now) / (3600 * 1000);

  const price = parseFloat(booking.price_amount) || 0;

  if (hoursUntilStart >= fullHours) {
    return price; // 100% refund
  } else if (hoursUntilStart >= partialHours) {
    return parseFloat((price * (partialPct / 100)).toFixed(2));
  } else {
    return 0.00; // 0% refund
  }
}

/**
 * Customer cancels their confirmed booking
 */
async function cancelBookingByCustomer(bookingId, customerUserId, reason = '') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) throw new Error('Booking not found.');

    const booking = bRes.rows[0];
    if (booking.customer_user_id !== customerUserId) {
      const err = new Error('Access denied to booking.');
      err.status = 403;
      throw err;
    }

    if (!['pending_payment', 'awaiting_provider', 'confirmed'].includes(booking.status)) {
      throw new Error(`Cannot cancel booking with current status '${booking.status}'.`);
    }

    let refundAmount = 0;
    if (booking.status === 'confirmed') {
      refundAmount = computeRefund(booking);

      // If paid via gift card and eligible for refund, restore balance to gift card
      if (booking.gift_card_id && refundAmount > 0) {
        await client.query(
          `UPDATE gift_cards
           SET balance = balance + $1, status = 'active'
           WHERE id = $2`,
          [refundAmount, booking.gift_card_id]
        );
      }
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled_by_customer', refund_amount = $1, updated_at = NOW()
       WHERE id = $2`,
      [refundAmount, booking.id]
    );

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, 'cancelled_by_customer', $3, $4)`,
      [booking.id, booking.status, customerUserId, reason || `Cancelled by customer (Refund: ${refundAmount} ${booking.currency})`]
    );

    await client.query('COMMIT');
    return { success: true, booking_id: booking.id, refund_amount: refundAmount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Provider cancels a booking (always 100% refund)
 */
async function cancelBookingByProvider(bookingId, providerUserId, reason) {
  if (!reason || String(reason).trim().length < 5) {
    throw new Error('A valid cancellation reason (at least 5 characters) is required.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) throw new Error('Booking not found.');

    const booking = bRes.rows[0];
    if (booking.provider_user_id !== providerUserId) {
      const err = new Error('You can only cancel bookings for your own services.');
      err.status = 403;
      throw err;
    }

    if (!['confirmed', 'awaiting_provider'].includes(booking.status)) {
      throw new Error(`Cannot cancel booking with current status '${booking.status}'.`);
    }

    const fullRefund = parseFloat(booking.price_amount) || 0;

    // Restore gift balance if paid with gift card
    if (booking.gift_card_id && fullRefund > 0) {
      await client.query(
        `UPDATE gift_cards
         SET balance = balance + $1, status = 'active'
         WHERE id = $2`,
        [fullRefund, booking.gift_card_id]
      );
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled_by_provider', refund_amount = $1, updated_at = NOW()
       WHERE id = $2`,
      [fullRefund, booking.id]
    );

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, 'cancelled_by_provider', $3, $4)`,
      [booking.id, booking.status, providerUserId, `Provider cancelled: ${reason}`]
    );

    await client.query('COMMIT');
    return { success: true, booking_id: booking.id, refund_amount: fullRefund };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Reschedules a confirmed booking to a new open slot atomically
 */
async function rescheduleBooking({ bookingId, newStartAt, customerUserId }) {
  const newStartDate = new Date(newStartAt);
  if (isNaN(newStartDate.getTime()) || newStartDate <= new Date()) {
    throw new Error('New appointment time must be a valid future date.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch booking with FOR UPDATE
    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) throw new Error('Booking not found.');

    const booking = bRes.rows[0];
    if (booking.customer_user_id !== customerUserId) {
      const err = new Error('Access denied to booking.');
      err.status = 403;
      throw err;
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be rescheduled.');
    }

    // Check reschedule count (max 2)
    if ((booking.reschedule_count || 0) >= 2) {
      throw new Error('Maximum reschedule limit (2 times) reached for this booking.');
    }

    // Check advance notice (at least 2 hours before existing appointment)
    const hoursNotice = (new Date(booking.start_at).getTime() - Date.now()) / (3600 * 1000);
    if (hoursNotice < 2) {
      throw new Error('Bookings can only be rescheduled at least 2 hours prior to the appointment.');
    }

    // 2. Fetch service capacity and duration
    const svcRes = await client.query(
      `SELECT duration_minutes, capacity FROM services WHERE id = $1`,
      [booking.service_id]
    );
    const service = svcRes.rows[0];
    const duration = parseInt(service?.duration_minutes || '60', 10);
    const capacity = parseInt(service?.capacity || '1', 10);

    const newEndDate = new Date(newStartDate.getTime() + duration * 60000);

    // 3. Acquire advisory lock on new slot
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1))`,
      [`booking_${booking.provider_user_id}_${newStartDate.toISOString()}`]
    );

    // 4. Verify capacity for new slot
    const countRes = await client.query(
      `SELECT COUNT(*) as active_count
       FROM bookings
       WHERE provider_user_id = $1
         AND start_at = $2
         AND id != $3
         AND status IN ('confirmed', 'awaiting_provider', 'pending_payment')
         AND (status != 'pending_payment' OR hold_expires_at > NOW())`,
      [booking.provider_user_id, newStartDate.toISOString(), booking.id]
    );

    if (parseInt(countRes.rows[0].active_count, 10) >= capacity) {
      const err = new Error('Target appointment slot is no longer available.');
      err.status = 409;
      throw err;
    }

    // 5. Update slot atomically
    const prevStart = booking.start_at;
    const newCount = (booking.reschedule_count || 0) + 1;

    const updRes = await client.query(
      `UPDATE bookings
       SET start_at = $1, end_at = $2, reschedule_count = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newStartDate.toISOString(), newEndDate.toISOString(), newCount, booking.id]
    );

    // 6. Record history
    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, 'confirmed', 'confirmed', $2, $3)`,
      [booking.id, customerUserId, `Rescheduled from ${prevStart} to ${newStartDate.toISOString()} (Count: ${newCount})`]
    );

    // 7. Cancel pending reminders and dispatch rescheduled notification (Batch 11)
    try {
      await cancelPendingBookingReminders(booking.id, client);
      const svcRes = await client.query('SELECT title FROM services WHERE id = $1', [booking.service_id]);
      const title = svcRes.rows[0]?.title || 'Healthcare Service';

      await notify('booking.rescheduled', {
        recipientName: 'Valued Customer',
        serviceTitle: title,
        newAppointmentTime: formatEthiopianDate(newStartDate),
        oldAppointmentTime: formatEthiopianDate(prevStart),
        reference: booking.reference,
        facilityAddress: 'Provider Facility',
      }, {
        subjectType: 'booking',
        subjectId: booking.id,
        actorUserId: customerUserId,
      }, client);
    } catch (notifErr) {
      console.warn('[Booking Reschedule] Notification warning:', notifErr.message);
    }

    await client.query('COMMIT');
    return updRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Provider marks appointment as completed
 */
async function markBookingCompleted(bookingId, providerUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) throw new Error('Booking not found.');

    const booking = bRes.rows[0];
    if (booking.provider_user_id !== providerUserId) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    if (booking.status !== 'confirmed') {
      throw new Error(`Only confirmed bookings can be marked completed (current: ${booking.status}).`);
    }

    // Notice: Can be set after booking start time has passed
    if (new Date(booking.start_at) > new Date()) {
      throw new Error('Appointment cannot be marked completed before the scheduled start time.');
    }

    await client.query(
      `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [booking.id]
    );

    await client.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, 'confirmed', 'completed', $2, 'Service rendered successfully')`,
      [booking.id, providerUserId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Provider marks customer as no-show
 */
async function markBookingNoShow(bookingId, providerUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bRes.rows.length === 0) throw new Error('Booking not found.');

    const booking = bRes.rows[0];
    if (booking.provider_user_id !== providerUserId) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    if (booking.status !== 'confirmed') {
      throw new Error(`Only confirmed bookings can be marked as no-show (current: ${booking.status}).`);
    }

    if (new Date(booking.start_at) > new Date()) {
      throw new Error('Cannot mark as no-show before the scheduled start time.');
    }

    await client.query(
      `UPDATE bookings SET status = 'no_show', updated_at = NOW() WHERE id = $1`,
      [booking.id]
    );

    await client.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, 'confirmed', 'no_show', $2, 'Customer failed to attend scheduled session')`,
      [booking.id, providerUserId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Periodic cleaner: marks lapsed holds as 'expired'
 */
async function cleanExpiredHolds() {
  try {
    const res = await pool.query(
      `UPDATE bookings
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'pending_payment' AND hold_expires_at < NOW()
       RETURNING id, reference`
    );

    for (const row of res.rows) {
      try {
        await pool.query(
          `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, reason)
           VALUES ($1, 'pending_payment', 'expired', NULL, '10-minute checkout hold lapsed')`,
          [row.id]
        );
      } catch (_) {}
    }

    return res.rowCount;
  } catch (err) {
    console.error('[cleanExpiredHolds] Error:', err.message);
    return 0;
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 7: Booking Query Builders
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Customer booking list (with itemized metadata)
 */
async function getCustomerBookings(customerUserId, { status, limit = 20, offset = 0 }) {
  let query = `
    SELECT b.*,
           s.title as current_service_title,
           COALESCE(p.provider_name, m.business_name, 'ODS Partner') as provider_name,
           COALESCE(p.official_phone, m.business_phone) as provider_phone
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN providers p ON b.provider_user_id = p.user_id
    LEFT JOIN merchants m ON b.provider_user_id = m.user_id
    WHERE b.customer_user_id = $1
  `;
  const params = [customerUserId];

  if (status) {
    if (status === 'upcoming') {
      query += ` AND b.status = 'confirmed' AND b.start_at >= NOW()`;
    } else if (status === 'past') {
      query += ` AND (b.status IN ('completed', 'no_show') OR (b.status = 'confirmed' AND b.start_at < NOW()))`;
    } else {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }
  }

  query += ` ORDER BY b.start_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Provider incoming appointments (customer phone masked until confirmed)
 */
async function getProviderBookings(providerUserId, { status, fromDate, toDate, limit = 50, offset = 0 }) {
  let query = `
    SELECT b.id, b.reference, b.service_id, b.start_at, b.end_at, b.status,
           b.price_amount, b.currency, b.customer_note, b.reschedule_count,
           b.service_snapshot, b.created_at,
           u.full_name as customer_name,
           CASE
             WHEN b.status = 'confirmed' THEN b.contact_phone
             ELSE '***-***-****'
           END as customer_phone,
           CASE
             WHEN b.status = 'confirmed' THEN u.email
             ELSE 'masked@customer.local'
           END as customer_email
    FROM bookings b
    JOIN users u ON b.customer_user_id = u.id
    WHERE b.provider_user_id = $1
  `;
  const params = [providerUserId];

  if (status) {
    query += ` AND b.status = $${params.length + 1}`;
    params.push(status);
  }
  if (fromDate) {
    query += ` AND b.start_at >= $${params.length + 1}`;
    params.push(new Date(fromDate).toISOString());
  }
  if (toDate) {
    query += ` AND b.start_at <= $${params.length + 1}`;
    params.push(new Date(toDate).toISOString());
  }

  query += ` ORDER BY b.start_at ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Retrieves booking details by ID (with tenant privacy checks)
 */
async function getBookingById(bookingId, requestingUser) {
  const res = await pool.query(
    `SELECT b.*,
            s.title as service_title,
            COALESCE(p.provider_name, m.business_name, 'ODS Partner') as provider_name,
            COALESCE(p.official_phone, m.business_phone) as provider_phone,
            COALESCE(p.official_email, m.business_email) as provider_email,
            u.full_name as customer_name,
            u.email as customer_account_email
     FROM bookings b
     LEFT JOIN services s ON b.service_id = s.id
     LEFT JOIN providers p ON b.provider_user_id = p.user_id
     LEFT JOIN merchants m ON b.provider_user_id = m.user_id
     LEFT JOIN users u ON b.customer_user_id = u.id
     WHERE b.id = $1`,
    [bookingId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const booking = res.rows[0];
  const isCustomer = requestingUser.id === booking.customer_user_id;
  const isProvider = requestingUser.id === booking.provider_user_id;
  const isAdmin = ['admin', 'super_admin'].includes(requestingUser.role);

  if (!isCustomer && !isProvider && !isAdmin) {
    const err = new Error('Access denied to booking.');
    err.status = 403;
    throw err;
  }

  // Fetch status history ledger
  const histRes = await pool.query(
    `SELECT bsh.*, u.full_name as actor_name
     FROM booking_status_history bsh
     LEFT JOIN users u ON bsh.actor_user_id = u.id
     WHERE bsh.booking_id = $1
     ORDER BY bsh.created_at ASC`,
    [bookingId]
  );

  booking.history = histRes.rows;

  // Mask contact info for provider if not confirmed
  if (isProvider && booking.status !== 'confirmed') {
    booking.contact_phone = '***-***-****';
    booking.customer_account_email = 'masked@customer.local';
  }

  return booking;
}

module.exports = {
  getWeeklyAvailability,
  setWeeklyAvailability,
  getAvailabilityExceptions,
  addAvailabilityException,
  deleteAvailabilityException,
  getAvailableSlots,
  createBookingHold,
  transitionBookingStatus,
  confirmPaidBooking,
  redeemGiftForBooking,
  computeRefund,
  cancelBookingByCustomer,
  cancelBookingByProvider,
  rescheduleBooking,
  markBookingCompleted,
  markBookingNoShow,
  cleanExpiredHolds,
  getCustomerBookings,
  getProviderBookings,
  getBookingById,
};
