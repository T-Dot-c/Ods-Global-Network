/**
 * ODS Global Network — Express API Server
 * Starts the backend auth service on PORT (default 3001).
 */
'use strict';

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

/* ── Security headers ─────────────────────────────────────── */
app.use(helmet());

/* ── CORS — allow frontend origin with credentials ────────── */
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,               // required for HttpOnly cookie round-trips
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

/* ── Body parsing + cookies ───────────────────────────────── */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ── Global rate limiter (100 req / 15 min per IP) ────────── */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
}));

/* ── Auth route — tighter limiter (20 req / 15 min per IP) ── */
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests — please slow down.' },
}), authRoutes);

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
  console.log(`✅ ODS API running on http://localhost:${PORT}`);
  console.log(`   CORS origin: ${FRONTEND_ORIGIN}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
