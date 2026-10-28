/**
 * ODS Global Network — Notification Scheduled Reminder Sweeper
 *
 * Scans upcoming bookings to schedule 24-hour and 1-hour reminders,
 * scans upcoming gift card expirations, and cancels outdated reminders
 * when an appointment is rescheduled or cancelled.
 */
'use strict';

const pool = require('../db');
const { notify } = require('./notificationService');
const { formatEthiopianDate } = require('./notificationTemplateService');

let schedulerTimer = null;
let isSchedulerRunning = false;
const SCHEDULER_INTERVAL_MS = 60000; // Check every 1 minute

/**
 * Sweeps bookings starting in (24h - window) and (1h - window) to schedule advance reminders
 */
async function sweepBookingReminders() {
  const client = await pool.connect();
  try {
    // 1. 24-hour booking reminder: appointments starting between NOW() + 23h and NOW() + 24h
    const query24h = `
      SELECT b.id, b.reference, b.start_at, b.customer_user_id, s.title as service_title,
             COALESCE(p.provider_name, 'Healthcare Provider') as provider_name
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      WHERE b.status = 'confirmed'
        AND b.start_at > NOW()
        AND b.start_at <= NOW() + INTERVAL '24 hours'
        AND b.start_at > NOW() + INTERVAL '23 hours'
        AND NOT EXISTS (
          SELECT 1 FROM notification_events ne
          WHERE ne.event_type = 'booking.reminder_24h'
            AND ne.subject_type = 'booking'
            AND ne.subject_id = b.id::text
        );
    `;

    const res24h = await client.query(query24h);
    for (const b of res24h.rows) {
      await notify('booking.reminder_24h', {
        serviceTitle: b.service_title,
        providerName: b.provider_name,
        appointmentTime: formatEthiopianDate(b.start_at),
        facilityAddress: 'Provider Facility',
        reference: b.reference,
      }, {
        subjectType: 'booking',
        subjectId: b.id,
      }, client);
    }

    // 2. 1-hour booking reminder: appointments starting between NOW() and NOW() + 1h
    const query1h = `
      SELECT b.id, b.reference, b.start_at, b.customer_user_id, s.title as service_title,
             COALESCE(p.provider_name, 'Healthcare Provider') as provider_name
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      WHERE b.status = 'confirmed'
        AND b.start_at > NOW()
        AND b.start_at <= NOW() + INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM notification_events ne
          WHERE ne.event_type = 'booking.reminder_1h'
            AND ne.subject_type = 'booking'
            AND ne.subject_id = b.id::text
        );
    `;

    const res1h = await client.query(query1h);
    for (const b of res1h.rows) {
      await notify('booking.reminder_1h', {
        serviceTitle: b.service_title,
        providerName: b.provider_name,
        appointmentTime: formatEthiopianDate(b.start_at),
        facilityAddress: 'Provider Facility',
        reference: b.reference,
      }, {
        subjectType: 'booking',
        subjectId: b.id,
      }, client);
    }
  } catch (err) {
    console.error('[NotificationScheduler] Booking reminder sweep error:', err.message);
  } finally {
    client.release();
  }
}

/**
 * Sweeps gift cards expiring in 7 days or 1 day
 */
async function sweepGiftCardExpiryWarnings() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT id, initial_amount, recipient_name, recipient_email, expiry_date
      FROM gift_cards
      WHERE status = 'delivered'
        AND expiry_date > NOW()
        AND expiry_date <= NOW() + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM notification_events ne
          WHERE ne.event_type = 'gift.expiry_warning'
            AND ne.subject_type = 'gift'
            AND ne.subject_id = gift_cards.id::text
        );
    `;

    const res = await client.query(query);
    for (const g of res.rows) {
      await notify('gift.expiry_warning', {
        recipientName: g.recipient_name,
        recipientEmail: g.recipient_email,
        amount: g.initial_amount,
        expiryDate: formatEthiopianDate(g.expiry_date),
      }, {
        subjectType: 'gift',
        subjectId: g.id,
      }, client);
    }
  } catch (err) {
    console.error('[NotificationScheduler] Gift expiry sweep error:', err.message);
  } finally {
    client.release();
  }
}

/**
 * When a booking is cancelled or rescheduled, cancel all pending future reminders
 */
async function cancelPendingBookingReminders(bookingId, client = null) {
  const runner = client || pool;
  await runner.query(`
    UPDATE notifications n
    SET status = 'skipped',
        last_error = 'Cancelled due to booking status change/reschedule',
        updated_at = NOW()
    FROM notification_events ne
    WHERE n.event_id = ne.id
      AND ne.subject_type = 'booking'
      AND ne.subject_id = $1
      AND n.status = 'pending'
      AND ne.event_type IN ('booking.reminder_24h', 'booking.reminder_1h');
  `, [String(bookingId)]);
}

/**
 * Starts scheduler loop
 */
function startScheduler(intervalMs = SCHEDULER_INTERVAL_MS) {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;
  console.log(`[NotificationScheduler] Started (sweeping every ${intervalMs}ms)...`);

  const loop = async () => {
    if (!isSchedulerRunning) return;
    try {
      await sweepBookingReminders();
      await sweepGiftCardExpiryWarnings();
    } catch (e) {
      console.error('[NotificationScheduler] Sweeper cycle uncaught error:', e.message);
    }
    if (isSchedulerRunning) {
      schedulerTimer = setTimeout(loop, intervalMs);
    }
  };

  loop();
}

/**
 * Stops scheduler loop
 */
function stopScheduler() {
  isSchedulerRunning = false;
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  console.log('[NotificationScheduler] Stopped.');
}

module.exports = {
  startScheduler,
  stopScheduler,
  sweepBookingReminders,
  sweepGiftCardExpiryWarnings,
  cancelPendingBookingReminders,
};
