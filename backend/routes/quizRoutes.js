const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { getQuiz, submitQuiz, getQuizHistory } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All quiz routes require authentication
router.use(protect);

/**
 * GET /api/quiz/get?subject=Math&topicId=xxx&grade=10
 * Fetch an adaptive quiz for the student based on their current difficulty level
 * Access: student
 */
router.get('/get', authorize('student'), getQuiz);

/**
 * POST /api/quiz/submit
 * Submit quiz answers, get score, and adapt difficulty
 * Body: { quizId, answers: [{ questionId, selectedOptionId }], timeTaken }
 * Access: student
 */
router.post(
  '/submit',
  authorize('student'),
  [
    body('quizId').notEmpty().withMessage('quizId is required').isMongoId().withMessage('Invalid quizId'),
    body('answers').isArray({ min: 1 }).withMessage('At least one answer is required'),
    body('timeTaken').optional().isNumeric().withMessage('timeTaken must be a number'),
  ],
  validate,
  submitQuiz
);

/**
 * GET /api/quiz/history
 * Get the student's recent quiz attempt history
 * Access: student
 */
router.get('/history', authorize('student'), getQuizHistory);

module.exports = router;
