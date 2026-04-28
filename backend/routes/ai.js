const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { askAI, getAIHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/ai/ask  — any authenticated user can ask
router.post(
  '/ask',
  protect,
  [body('question').trim().notEmpty().withMessage('Question cannot be empty')],
  validate,
  askAI
);

// GET /api/ai/history
router.get('/history', protect, getAIHistory);

module.exports = router;
