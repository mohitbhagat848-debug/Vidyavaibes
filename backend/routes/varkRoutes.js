const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { submitVark, getVarkResult } = require('../controllers/varkController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All VARK routes require authentication and student role
router.use(protect, authorize('student'));

/**
 * POST /api/vark/submit
 * Submit VARK answers — determines and stores learning style
 * Body: { answers: [{ questionIndex, selectedStyle }] }
 */
router.post(
  '/submit',
  [
    body('answers')
      .isArray({ min: 1 }).withMessage('Answers must be a non-empty array'),
    body('answers.*.selectedStyle')
      .isIn(['visual', 'auditory', 'reading', 'kinesthetic'])
      .withMessage('Each answer must be visual, auditory, reading, or kinesthetic'),
  ],
  validate,
  submitVark
);

/**
 * GET /api/vark/result
 * Get the stored VARK result for the current student
 */
router.get('/result', getVarkResult);

module.exports = router;
