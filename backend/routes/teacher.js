const express = require('express');
const router = express.Router();
const {
  getTeacherDashboard,
  getStudentPerformance,
  notifyStudent,
  syncStudentProgress,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// All routes require authentication
router.use(protect);

// ── Sync Progress (any authenticated user — called by students) ───────────────
// This route is placed BEFORE the teacher-only authorize middleware
router.post(
  '/sync-progress',
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('score').isNumeric().withMessage('Score must be a number'),
  ],
  validate,
  syncStudentProgress
);

// ── Teacher-only routes below ─────────────────────────────────────────────────
router.use(authorize('teacher'));

// GET  /api/teacher/dashboard?grade=10&subject=Math
router.get('/dashboard', getTeacherDashboard);

// GET  /api/teacher/student/:studentId
router.get('/student/:studentId', getStudentPerformance);

// POST /api/teacher/notify/:studentId
router.post(
  '/notify/:studentId',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validate,
  notifyStudent
);

module.exports = router;
