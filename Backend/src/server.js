/**
 * ODS Global Network — Express API Server
 * Starts the backend auth service on PORT (default 3001).
 */
'use strict';

require('dotenv').config();
const fs            = require('fs');
const path          = require('path');
const express       = require('express');
const cors          = require('cors');
const cookieParser  = require('cookie-parser');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const supportRoutes = require('./routes/support');
const partnerRoutes = require('./routes/partners');

/* ── Storage Directory Initialization ───────────────────────── */
const UPLOADS_PRIVATE_DIR = path.resolve(__dirname, '../uploads/private');
if (!fs.existsSync(UPLOADS_PRIVATE_DIR)) {
  fs.mkdirSync(UPLOADS_PRIVATE_DIR, { recursive: true });
}

const app  = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

/* ── Environment & Security Validation ──────────────────────── */
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'CHANGE_ME_IN_PRODUCTION' || process.env.JWT_SECRET.length < 32) {
  console.error('[FATAL SECURITY ERROR] JWT_SECRET must be set to a secure string of at least 32 characters in .env.');
  process.exit(1);
}

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
if (!isDevOrTest) {
  if (!process.env.STAGING_TOKEN_SECRET || process.env.STAGING_TOKEN_SECRET.length < 32) {
    console.error('[FATAL SECURITY ERROR] STAGING_TOKEN_SECRET must be set to at least 32 characters unless NODE_ENV is explicitly development or test.');
    process.exit(1);
  }
  try {
    const originUrl = new URL(FRONTEND_ORIGIN);
    if (originUrl.protocol !== 'https:') {
      console.error(`[FATAL SECURITY ERROR] FRONTEND_ORIGIN must use HTTPS outside development/test (current FRONTEND_ORIGIN="${FRONTEND_ORIGIN}").`);
      process.exit(1);
    }
  } catch {
    console.error(`[FATAL SECURITY ERROR] FRONTEND_ORIGIN is not a valid URL: "${FRONTEND_ORIGIN}".`);
    process.exit(1);
  }
}

/* ── Trust Proxy Configuration ────────────────────────────── */
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === 'true' || trustProxy === '1') {
  app.set('trust proxy', 1);
}

/* ── Security headers ─────────────────────────────────────── */
app.use(helmet());

/* ── CORS — allow frontend origin with credentials ────────── */
const devOrigins = [
  FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile, curl, Postman)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      if (
        devOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://[::1]:')
      ) {
        return callback(null, true);
      }
    }
    if (origin === FRONTEND_ORIGIN) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy rejection: origin ${origin} is not allowed.`));
  },
  credentials: true,               // required for HttpOnly cookie round-trips
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-chapa-signature', 'chapa-signature'],
}));

/* ── Body parsing + cookies ───────────────────────────────── */
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ── Global rate limiter (default: 100 req / 15 min per IP) ─── */
app.use(rateLimit({
  windowMs: process.env.RATE_LIMIT_GLOBAL_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 10)
    : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_GLOBAL_MAX
    ? parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10)
    : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
}));

/* ── Auth route — tighter limiter (default: 20 req / 15 min per IP) ── */
app.use('/api/auth', rateLimit({
  windowMs: process.env.RATE_LIMIT_AUTH_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10)
    : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_AUTH_MAX
    ? parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10)
    : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests — please slow down.' },
}), authRoutes);

/* ── Customer portal route (Batch 3) ──────────────────────── */
const customerRoutes = require('./routes/customer');
app.use('/api/customer', rateLimit({
  windowMs: process.env.RATE_LIMIT_CUSTOMER_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_CUSTOMER_WINDOW_MS, 10)
    : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_CUSTOMER_MAX
    ? parseInt(process.env.RATE_LIMIT_CUSTOMER_MAX, 10)
    : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many customer portal requests — please slow down.' },
}), customerRoutes);

/* ── Public inquiry routes (Batch 2) ──────────────────────── */
app.use('/api/support', supportRoutes);
app.use('/api/partners', partnerRoutes);

/* ── Shared documents route (Batch 4) ─────────────────────── */
const documentRoutes = require('./routes/documents');
app.use('/api/documents', documentRoutes);

/* ── Merchant & Provider routes (Batch 4) ─────────────────── */
const merchantRoutes = require('./routes/merchant');
const providerRoutes = require('./routes/provider');
app.use('/api/merchant', merchantRoutes);
app.use('/api/provider', providerRoutes);

/* ── Admin routes (Batch 4) ───────────────────────────────── */
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

/* ── Payment routes (Batch 6) ─────────────────────────────── */
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

/* ── Start unattached document sweeper ────────────────────── */
const { startSweeper } = require('./services/sweeperService');
startSweeper();

/* ── Health check ─────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ODS Global Network API', ts: new Date().toISOString() });
});

/* ── 404 fallback ─────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

/* ── Global error handler ─────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[server error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Start ────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[ODS API] Running on http://localhost:${PORT}`);
  console.log(`   CORS origin: ${FRONTEND_ORIGIN}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
