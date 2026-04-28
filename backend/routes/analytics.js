const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getTeacherAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analytics/student  — student sees their own analytics
router.get('/student', protect, authorize('student'), getStudentAnalytics);

// GET /api/analytics/teacher?grade=10&subject=Math  — teacher sees class analytics
router.get('/teacher', protect, authorize('teacher'), getTeacherAnalytics);

module.exports = router;
