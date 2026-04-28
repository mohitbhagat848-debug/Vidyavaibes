const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (student / teacher / parent)
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, password, role, grade, parentEmail } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create the user (Password hashing is handled in User.create now)
    const user = await User.create({ name, email, password, role, grade });

    // If student, create a linked StudentProfile
    if (role === 'student') {
      await StudentProfile.create({ userId: user._id });

      // Link to parent if parentEmail is provided
      if (parentEmail) {
        const parent = await User.findOne({ email: parentEmail, role: 'parent' });
        if (parent) {
          await User.findByIdAndUpdate(user._id, { parentId: parent._id });
          await User.addToSet(parent._id, 'children', user._id);
        }
      }
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        learningStyle: user.learningStyle || null,
        onboardingComplete: user.onboardingComplete || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';

    // Find user (Explicitly select * to ensure password hash is returned)
    const user = await User.findOne({ email }).select('*');
    console.log(`[Login] Attempt for: ${email} | Found: ${!!user}`);
    
    if (!user) {
      console.log(`[Login] User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password using static helper
    const isMatch = await User.matchPassword(password, user.password);
    console.log(`[Login] Password match for ${email}: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login timestamp
    const now = new Date();
    await User.findByIdAndUpdate(user._id, { lastLogin: now });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        learningStyle: user.learningStyle || null,
        onboardingComplete: user.onboardingComplete || false,
        lastLogin: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If student, attach profile info too
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        avatar: user.avatar || '',
        learningStyle: user.learningStyle || null,
        onboardingComplete: user.onboardingComplete || false,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (name, avatar, grade)
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, grade } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar, grade },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulated Google Auth (Login / Signup)
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user = await User.findOne({ email });
    const now = new Date();

    if (!user) {
      // Create user if they don't exist
      user = await User.create({ 
        name: name || email.split('@')[0], 
        email, 
        password: Math.random().toString(36).slice(-8) + 'GAuth!', // random secure password
        role: role || 'student'
      });
      if (user.role === 'student') {
        const StudentProfile = require('../models/StudentProfile');
        await StudentProfile.create({ userId: user._id });
      }
    } else {
      await User.findByIdAndUpdate(user._id, { lastLogin: now });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google auth successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        learningStyle: user.learningStyle || null,
        onboardingComplete: user.onboardingComplete || false,
        lastLogin: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, updateProfile, googleAuth };
