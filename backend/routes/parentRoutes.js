const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const {
  getParentDashboard,
  linkChild,
  getWeeklyReport,
} = require('../controllers/parentController');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All parent routes require authentication + parent role
router.use(protect, authorize('parent'));

/**
 * GET /api/parent/dashboard
 * Returns overview data for all linked children:
 *   - Quiz performance, progress, weekly summary, strengths & weak areas
 */
router.get('/dashboard', getParentDashboard);

/**
 * POST /api/parent/link-child
 * Link a student to this parent account by the student's email
 * Body: { childEmail: "student@example.com" }
 */
router.post(
  '/link-child',
  [
    body('childEmail')
      .trim()
      .isEmail().withMessage('Please provide a valid student email')
      .normalizeEmail(),
  ],
  validate,
  linkChild
);

/**
 * GET /api/parent/weekly-report/:childId
 * Get detailed weekly report for a specific child
 */
router.get(
  '/weekly-report/:childId',
  [param('childId').isMongoId().withMessage('Invalid child ID')],
  validate,
  getWeeklyReport
);

module.exports = router;
