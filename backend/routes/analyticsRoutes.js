const express = require('express');
const router = express.Router();

const { getStudentAnalytics, getTeacherAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All analytics routes require authentication
router.use(protect);

/**
 * GET /api/analytics/student
 * Returns full analytics for the logged-in student:
 *   - Overview (avg score, pass rate, progress %, mastery, streak)
 *   - Topic breakdown
 *   - Weekly summary
 *   - Subject averages
 *   - Strengths & weak areas
 * Access: student
 */
router.get('/student', authorize('student'), getStudentAnalytics);

/**
 * GET /api/analytics/teacher?grade=10&subject=Math
 * Returns class-wide analytics for a teacher:
 *   - Per-student performance summaries
 *   - At-risk student identification
 *   - Subject-wise class averages
 * Access: teacher
 */
router.get('/teacher', authorize('teacher'), getTeacherAnalytics);

module.exports = router;
