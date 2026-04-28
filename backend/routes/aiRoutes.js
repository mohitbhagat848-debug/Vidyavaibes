const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { askAI, getAIHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All AI routes require authentication (any role can use the assistant)
router.use(protect);

/**
 * POST /api/ai/ask
 * Ask the AI tutor a question
 * Body: { question: "...", context: "..." (optional) }
 * Tries Gemini first, then OpenAI, then returns a mock response in dev mode
 */
router.post(
  '/ask',
  [
    body('question')
      .trim()
      .notEmpty().withMessage('Question cannot be empty')
      .isLength({ max: 2000 }).withMessage('Question cannot exceed 2000 characters'),
    body('context')
      .optional()
      .isString()
      .isLength({ max: 1000 }).withMessage('Context cannot exceed 1000 characters'),
  ],
  validate,
  askAI
);

/**
 * GET /api/ai/history
 * Get AI chat history for the current user (placeholder — returns empty in v1)
 */
router.get('/history', getAIHistory);

module.exports = router;
