// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { createJob, getJobs } = require('../controllers/jobController');

// POST a new job (Admin)
router.post('/', createJob);

// GET all jobs
router.get('/', getJobs);

module.exports = router;

