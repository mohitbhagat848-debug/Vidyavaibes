const express = require('express');
const router = express.Router();
const { submitVark, getVarkResult } = require('../controllers/varkController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/vark/submit  — student submits VARK assessment
router.post('/submit', protect, authorize('student'), submitVark);

// GET /api/vark/result   — student gets their VARK result
router.get('/result', protect, authorize('student'), getVarkResult);

module.exports = router;
