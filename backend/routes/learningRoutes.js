const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const {
  getContent,
  getTopicById,
  markTopicComplete,
  updateProgress,
  saveNote,
  toggleBookmark,
} = require('../controllers/learningController');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All learning routes require authentication + student role
router.use(protect, authorize('student'));

/**
 * GET /api/learning/get-content?subject=Math&grade=10
 * Returns personalized content based on the student's learning style
 */
router.get('/get-content', getContent);

/**
 * GET /api/learning/topic/:id
 * Fetch a single topic and mark it as in-progress
 */
router.get('/topic/:id', getTopicById);

/**
 * PUT /api/learning/complete/:topicId
 * Mark a topic as 100% completed
 * Body: { timeSpent: <minutes> }
 */
router.put(
  '/complete/:topicId',
  [body('timeSpent').optional().isNumeric().withMessage('timeSpent must be a number')],
  validate,
  markTopicComplete
);

/**
 * PUT /api/learning/progress/:topicId
 * Update completion percentage for a topic
 * Body: { completionPercentage: 0-100, timeSpent: <minutes> }
 */
router.put(
  '/progress/:topicId',
  [
    body('completionPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('completionPercentage must be between 0 and 100'),
    body('timeSpent').optional().isNumeric().withMessage('timeSpent must be a number'),
  ],
  validate,
  updateProgress
);

/**
 * POST /api/learning/notes/:topicId
 * Save or update a personal note for a topic
 * Body: { content: "..." }
 */
router.post(
  '/notes/:topicId',
  [body('content').trim().notEmpty().withMessage('Note content cannot be empty')],
  validate,
  saveNote
);

/**
 * POST /api/learning/bookmark/:topicId
 * Toggle bookmark on a topic (adds if not bookmarked, removes if already bookmarked)
 */
router.post('/bookmark/:topicId', toggleBookmark);

module.exports = router;
