/**
 * ODS Global Network — Persistent Rate Limiter Service
 * 
 * PostgreSQL-backed atomic token bucket / sliding counter stored in `rate_limit_buckets`.
 * Enforces rate limits across server restarts and concurrent clustered processes.
 */
'use strict';

const pool = require('../db');

/**
 * Atomically increments the hit counter for a given key within a time window.
 * Returns { allowed: boolean, currentPoints: number, resetTimeMs: number, remaining: number }
 *
 * @param {string} key Unique identifier (e.g., "ip:1.2.3.4:login", "email:test@ods.com:forgot")
 * @param {number} maxRequests Maximum allowed hits within the window
 * @param {number} windowMs Window duration in milliseconds
 * @returns {Promise<{allowed: boolean, currentPoints: number, resetTimeMs: number, remaining: number}>}
 */
async function consumeRateLimit(key, maxRequests, windowMs) {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const now = Date.now();
  
  try {
    const query = `
      INSERT INTO rate_limit_buckets (key, points, expire_at, updated_at)
      VALUES ($1, 1, NOW() + ($2 || ' seconds')::interval, NOW())
      ON CONFLICT (key) DO UPDATE
      SET 
        points = CASE 
          WHEN rate_limit_buckets.expire_at <= NOW() THEN 1 
          ELSE rate_limit_buckets.points + 1 
        END,
        expire_at = CASE 
          WHEN rate_limit_buckets.expire_at <= NOW() THEN NOW() + ($2 || ' seconds')::interval 
          ELSE rate_limit_buckets.expire_at 
        END,
        updated_at = NOW()
      RETURNING points, EXTRACT(EPOCH FROM expire_at) * 1000 AS reset_time_ms;
    `;

    const res = await pool.query(query, [key, windowSeconds]);
    const row = res.rows[0];
    const points = parseInt(row.points, 10);
    const resetTimeMs = Math.round(parseFloat(row.reset_time_ms));
    const allowed = points <= maxRequests;
    const remaining = Math.max(0, maxRequests - points);

    return { allowed, currentPoints: points, resetTimeMs, remaining };
  } catch (err) {
    console.error(`[RateLimiter] Database error on key "${key}":`, err.message);
    // Graceful fallback to prevent application downtime during transient DB issues
    return { allowed: true, currentPoints: 1, resetTimeMs: now + windowMs, remaining: maxRequests - 1 };
  }
}

/**
 * Express middleware factory for persistent rate limiting.
 *
 * @param {Object} options
 * @param {number} options.windowMs Window in milliseconds (default: 15 minutes)
 * @param {number} options.max Maximum requests allowed in window
 * @param {string} [options.prefix] Key prefix (e.g. 'auth_login')
 * @param {Function} [options.keyGenerator] Custom key generator (default: IP)
 * @param {Object} [options.message] Custom response JSON
 */
function createRateLimiter(options) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const prefix = options.prefix || 'rl';
  const keyGenerator = options.keyGenerator || ((req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  });
  const message = options.message || {
    success: false,
    message: 'Too many requests. Please try again later.',
  };

  return async function rateLimitMiddleware(req, res, next) {
    const rawKey = keyGenerator(req);
    const fullKey = `${prefix}:${rawKey}`;

    const { allowed, currentPoints, resetTimeMs, remaining } = await consumeRateLimit(fullKey, max, windowMs);

    const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - Date.now()) / 1000));

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(resetTimeMs / 1000));

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        ...message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/**
 * Secondary abuse check for arbitrary keys (e.g., per-email caps for password reset or verification).
 * Returns true if limit is exceeded, false if allowed.
 */
async function isKeyLimitExceeded(key, maxRequests, windowMs) {
  const result = await consumeRateLimit(key, maxRequests, windowMs);
  return !result.allowed;
}

/**
 * Periodic cleanup of expired rate limit buckets.
 */
async function cleanupExpiredBuckets() {
  try {
    const res = await pool.query(`DELETE FROM rate_limit_buckets WHERE expire_at < NOW() - INTERVAL '1 hour'`);
    if (res.rowCount > 0) {
      console.log(`[RateLimiter] Purged ${res.rowCount} expired rate limit buckets.`);
    }
  } catch (err) {
    console.error('[RateLimiter] Error cleaning up expired buckets:', err.message);
  }
}

// Background cleanup interval (runs hourly)
const cleanupTimer = setInterval(cleanupExpiredBuckets, 60 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

module.exports = {
  consumeRateLimit,
  createRateLimiter,
  isKeyLimitExceeded,
  cleanupExpiredBuckets,
};
