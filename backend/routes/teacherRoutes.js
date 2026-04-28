const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const {
  getTeacherDashboard,
  getStudentPerformance,
  notifyStudent,
  syncStudentProgress,
} = require('../controllers/teacherController');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All teacher routes require authentication
router.use(protect);

/**
 * GET /api/teacher/dashboard?grade=10&subject=Math
 * Returns all students with performance data, at-risk flags, and summary stats
 * Access: teacher only
 */
router.get('/dashboard', authorize('teacher'), getTeacherDashboard);

/**
 * GET /api/teacher/student/:studentId
 * Get detailed performance breakdown for a specific student
 * Access: teacher only
 */
router.get(
  '/student/:studentId',
  authorize('teacher'),
  [param('studentId').notEmpty().withMessage('Student ID is required')],
  validate,
  getStudentPerformance
);

/**
 * POST /api/teacher/notify/:studentId
 * Send a notification/message to a specific student
 * Access: teacher only
 */
router.post(
  '/notify/:studentId',
  authorize('teacher'),
  [
    param('studentId').notEmpty().withMessage('Student ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validate,
  notifyStudent
);

/**
 * POST /api/teacher/sync-progress
 * Student calls this after completing a course day/quiz to persist progress to Supabase
 * Access: any authenticated user (student or teacher)
 */
router.post(
  '/sync-progress',
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('score').isNumeric().withMessage('Score must be a number'),
  ],
  validate,
  syncStudentProgress
);

module.exports = router;
