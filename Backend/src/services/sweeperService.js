/**
 * ODS Global Network — Unattached Document Sweeper Service
 *
 * Runs on startup and on a periodic schedule (default 15 minutes).
 * Guarded query: DELETE ... WHERE is_attached = FALSE AND expires_at <= NOW()
 * Sequence: Database row is deleted FIRST, then file is unlinked from disk.
 * Tolerates missing disk file (ENOENT) gracefully.
 */
'use strict';

const fs = require('fs');
const pool = require('../db');
const { logAuditEvent } = require('./auditService');

async function sweepExpiredDocuments() {
  const client = await pool.connect();
  try {
    const deleteRes = await client.query(`
      DELETE FROM documents
      WHERE is_attached = FALSE
        AND expires_at <= NOW()
      RETURNING id, storage_path
    `);

    for (const doc of deleteRes.rows) {
      if (doc.storage_path) {
        try {
          await fs.promises.unlink(doc.storage_path);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`[Sweeper] Failed to unlink ${doc.storage_path}:`, err.message);
          }
        }
      }
    }

    await logAuditEvent({
      userId: null,
      action: 'DOCUMENT_PURGED',
      details: {
        purged_count: deleteRes.rows.length,
        document_ids: deleteRes.rows.map(r => r.id),
      },
    });

    if (deleteRes.rows.length > 0) {
      console.log(`[Sweeper] Purged ${deleteRes.rows.length} expired unattached document(s).`);
    }
    return deleteRes.rows.length;
  } catch (err) {
    console.error('[Sweeper Error]', err.message);
    return 0;
  } finally {
    client.release();
  }
}

let sweeperInterval = null;

function startSweeper(intervalMs = 15 * 60 * 1000) {
  // Run sweep on startup
  sweepExpiredDocuments().catch(err => console.error('[Sweeper Startup Error]', err.message));

  // Schedule recurring sweep
  if (!sweeperInterval) {
    sweeperInterval = setInterval(() => {
      sweepExpiredDocuments().catch(err => console.error('[Sweeper Interval Error]', err.message));
    }, intervalMs);
    if (sweeperInterval.unref) {
      sweeperInterval.unref();
    }
  }
}

function stopSweeper() {
  if (sweeperInterval) {
    clearInterval(sweeperInterval);
    sweeperInterval = null;
  }
}

module.exports = {
  sweepExpiredDocuments,
  runSweeper: sweepExpiredDocuments,
  startSweeper,
  stopSweeper,
};
