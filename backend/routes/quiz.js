const express = require('express');
const router = express.Router();
const { getQuiz, submitQuiz, getQuizHistory } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));

// GET  /api/quiz/get?subject=Math&topicId=xxx&grade=10
router.get('/get', getQuiz);

// POST /api/quiz/submit
router.post('/submit', submitQuiz);

// GET  /api/quiz/history
router.get('/history', getQuizHistory);

module.exports = router;
