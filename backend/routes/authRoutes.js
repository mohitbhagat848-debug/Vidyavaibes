const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { signup, login, getMe, updateProfile, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation Rules ─────────────────────────────────────────────────────────

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['student', 'teacher', 'parent']).withMessage('Role must be student, teacher, or parent'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Register a new user (student / teacher / parent)
 */
router.post('/signup', signupValidation, validate, signup);

/**
 * POST /api/auth/login
 * Login with email & password — returns JWT
 */
router.post('/login', loginValidation, validate, login);

/**
 * POST /api/auth/google
 * Simulated Google Auth login/signup
 */
router.post('/google', googleAuth);

/**
 * GET /api/auth/me
 * Get currently logged-in user's profile
 */
router.get('/me', protect, getMe);

/**
 * PUT /api/auth/update-profile
 * Update name, avatar, or grade
 */
router.put('/update-profile', protect, updateProfile);

module.exports = router;
