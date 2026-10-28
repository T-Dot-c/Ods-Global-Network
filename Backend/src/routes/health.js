/**
 * ODS Global Network — Operational Health Probes
 *
 * Endpoints:
 * - GET /health/liveness   Process responsiveness probe (Kubernetes / monitoring)
 * - GET /health/readiness  Database and dependency readiness probe
 */
'use strict';

const express = require('express');
const pool = require('../db');

const router = express.Router();

/* ── Liveness Probe ─────────────────────────────────────────── */
router.get('/liveness', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ── Readiness Probe ────────────────────────────────────────── */
router.get('/readiness', async (_req, res) => {
  const startTime = Date.now();
  try {
    const dbRes = await pool.query('SELECT 1 AS alive');
    const latencyMs = Date.now() - startTime;

    if (dbRes.rows.length === 0 || dbRes.rows[0].alive !== 1) {
      throw new Error('Database ping did not return expected response.');
    }

    return res.status(200).json({
      status: 'ready',
      database: {
        status: 'connected',
        latencyMs,
        pool: {
          totalCount: pool.totalCount || 0,
          idleCount: pool.idleCount || 0,
          waitingCount: pool.waitingCount || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Readiness Probe Failed]:', err.message);
    return res.status(503).json({
      status: 'unready',
      database: {
        status: 'disconnected',
        error: err.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
