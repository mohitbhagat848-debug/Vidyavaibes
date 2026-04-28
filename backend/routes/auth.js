const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { signup, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation Rules ──────────────────────────────────────────────────────────

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'teacher', 'parent']).withMessage('Role must be student, teacher, or parent'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post('/signup', signupValidation, validate, signup);

// POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/update-profile
router.put('/update-profile', protect, updateProfile);

module.exports = router;
