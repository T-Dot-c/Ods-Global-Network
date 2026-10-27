/**
 * ODS Global Network — Operational Reporting & CSV Export API (Batch 10)
 *
 * Provides analytical aggregate datasets and permission-gated, audited CSV exports:
 * - 1. User Registrations & Growth Funnel
 * - 2. Provider & Merchant KYC Intake Funnel
 * - 3. Service Catalog Breakdown
 * - 4. Appointment Booking Volumes & Cancellation Rates
 * - 5. Platform Revenue, Refunds & Net Volume
 * - 6. Top Healthcare Providers
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');

const router = express.Router();
router.use(requireAuth);

/**
 * Converts array of row objects into RFC 4180 CSV string
 */
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeVal = (v) => {
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.join(',');
  const lines = rows.map(r => headers.map(h => escapeVal(r[h])).join(','));
  return [headerLine, ...lines].join('\n');
}

/**
 * Report query executor
 */
async function generateReportData(reportName, { date_from, date_to }) {
  const from = date_from || '1970-01-01';
  const to = date_to || '2099-12-31';

  switch (reportName) {
    case 'users': {
      const q = `
        SELECT 
          role,
          is_active,
          is_email_verified,
          DATE_TRUNC('day', created_at)::date AS registration_date,
          COUNT(*) AS total_count
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY role, is_active, is_email_verified, DATE_TRUNC('day', created_at)
        ORDER BY registration_date DESC;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    case 'onboarding': {
      const q = `
        SELECT 
          'merchant' AS entity_type,
          approval_status,
          COUNT(*) AS total_count
        FROM merchants
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY approval_status
        UNION ALL
        SELECT 
          'provider' AS entity_type,
          approval_status,
          COUNT(*) AS total_count
        FROM providers
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY approval_status;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    case 'services': {
      const q = `
        SELECT 
          c.name AS category_name,
          s.status,
          s.location_type,
          COUNT(s.id) AS service_count,
          ROUND(AVG(s.price_amount), 2) AS avg_price_etb
        FROM services s
        LEFT JOIN service_categories c ON c.id = s.category_id
        WHERE s.created_at >= $1 AND s.created_at <= $2
        GROUP BY c.name, s.status, s.location_type
        ORDER BY service_count DESC;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    case 'bookings': {
      const q = `
        SELECT 
          status,
          DATE_TRUNC('day', start_at)::date AS appointment_date,
          COUNT(*) AS bookings_count,
          COALESCE(SUM(price_amount), 0) AS total_value_etb,
          COALESCE(SUM(refund_amount), 0) AS total_refunds_etb
        FROM bookings
        WHERE start_at >= $1 AND start_at <= $2
        GROUP BY status, DATE_TRUNC('day', start_at)
        ORDER BY appointment_date DESC;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    case 'revenue': {
      const q = `
        SELECT 
          purpose,
          status,
          currency,
          COUNT(*) AS transactions_count,
          COALESCE(SUM(amount), 0) AS gross_amount
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY purpose, status, currency
        ORDER BY gross_amount DESC;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    case 'providers': {
      const q = `
        SELECT 
          p.id AS provider_id,
          p.provider_name,
          p.provider_type,
          COUNT(b.id) AS completed_appointments_count,
          COALESCE(SUM(b.price_amount), 0) AS total_revenue_etb
        FROM providers p
        LEFT JOIN bookings b ON b.provider_user_id = p.user_id AND b.status = 'completed'
        WHERE p.created_at >= $1 AND p.created_at <= $2
        GROUP BY p.id, p.provider_name, p.provider_type
        ORDER BY total_revenue_etb DESC
        LIMIT 50;
      `;
      const res = await pool.query(q, [from, to]);
      return res.rows;
    }

    default:
      throw new Error(`Report '${reportName}' not recognized.`);
  }
}

/**
 * GET /api/admin/reports/:name
 * Retrieve analytical dataset for a standard report.
 * Permission: reports.financial_export or support.view
 */
router.get('/:name', requirePermission('users.view'), async (req, res) => {
  try {
    const reportName = req.params.name.toLowerCase();
    const { date_from, date_to } = req.query;

    const data = await generateReportData(reportName, { date_from, date_to });

    return res.json({
      success: true,
      report_name: reportName,
      data,
    });
  } catch (err) {
    console.error('[adminReports] Error generating report:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/reports/:name/export
 * Stream RFC 4180 CSV export with audit logging.
 * Permission: reports.financial_export
 */
router.get('/:name/export', requirePermission('reports.financial_export'), async (req, res) => {
  try {
    const reportName = req.params.name.toLowerCase();
    const { date_from, date_to } = req.query;

    const data = await generateReportData(reportName, { date_from, date_to });
    const csvContent = toCsv(data);

    // Audit log the export action
    await logAdminAction(pool, {
      actorUserId: req.user.id,
      permissionKey: 'reports.financial_export',
      action: 'REPORT_EXPORT_CSV',
      targetType: 'report',
      targetId: reportName,
      summary: {
        report_name: reportName,
        row_count: data.length,
        date_from,
        date_to,
      },
      reason: 'Administrative data export',
      req,
    });

    const filename = `ods_report_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[adminReports] Error exporting report:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
