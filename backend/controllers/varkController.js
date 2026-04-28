const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

/**
 * VARK Assessment Logic
 * Each question maps to a learning style.
 * The style with the highest score becomes the student's dominant style.
 *
 * Question-to-style mapping (sent from frontend):
 * Each answer object: { questionIndex: 0, answer: 'visual' | 'auditory' | 'reading' | 'kinesthetic' }
 */

/**
 * @desc    Submit VARK assessment answers and determine learning style
 * @route   POST /api/vark/submit
 * @access  Private (students only)
 */
const submitVark = async (req, res, next) => {
  try {
    const { answers } = req.body;
    // answers: Array of { questionIndex, selectedStyle }
    // Example: [{ questionIndex: 0, selectedStyle: 'visual' }, ...]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required.',
      });
    }

    // Tally scores for each learning style
    const scores = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };

    for (const answer of answers) {
      const style = answer.selectedStyle;
      if (scores.hasOwnProperty(style)) {
        scores[style]++;
      }
    }

    // Determine dominant learning style
    const dominantStyle = Object.entries(scores).reduce(
      (a, b) => (b[1] > a[1] ? b : a)
    )[0];

    // Update StudentProfile with VARK scores and learning style
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        varkScores: scores,
        learningStyle: dominantStyle,
      },
      { new: true, upsert: true }
    );

    // Also update the User document
    await User.findByIdAndUpdate(req.user._id, {
      learningStyle: dominantStyle,
      onboardingComplete: true,
    });

    res.status(200).json({
      success: true,
      message: 'VARK assessment completed.',
      result: {
        scores,
        dominantStyle,
        description: getLearningStyleDescription(dominantStyle),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get VARK result for the current student
 * @route   GET /api/vark/result
 * @access  Private (students only)
 */
const getVarkResult = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });

    if (!profile || !profile.learningStyle) {
      return res.status(404).json({
        success: false,
        message: 'VARK assessment not completed yet.',
      });
    }

    res.status(200).json({
      success: true,
      result: {
        scores: profile.varkScores,
        dominantStyle: profile.learningStyle,
        description: getLearningStyleDescription(profile.learningStyle),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Returns a description for each learning style
 */
const getLearningStyleDescription = (style) => {
  const descriptions = {
    visual:
      'You learn best through images, diagrams, charts, and visual representations. Look for videos and infographics.',
    auditory:
      'You learn best by listening and speaking. Podcasts, discussions, and verbal explanations work great for you.',
    reading:
      'You learn best through reading and writing. Articles, notes, and text-based resources are your strength.',
    kinesthetic:
      'You learn best through hands-on practice and real-world activities. Try exercises and interactive content.',
  };
  return descriptions[style] || '';
};

module.exports = { submitVark, getVarkResult };
