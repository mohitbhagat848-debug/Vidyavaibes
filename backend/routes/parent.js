const express = require('express');
const router = express.Router();
const { getParentDashboard, linkChild, getWeeklyReport } = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.use(protect, authorize('parent'));

// GET  /api/parent/dashboard
router.get('/dashboard', getParentDashboard);

// POST /api/parent/link-child
router.post(
  '/link-child',
  [body('childEmail').isEmail().normalizeEmail().withMessage('Valid child email is required')],
  validate,
  linkChild
);

// GET  /api/parent/weekly-report/:childId
router.get('/weekly-report/:childId', getWeeklyReport);

module.exports = router;
