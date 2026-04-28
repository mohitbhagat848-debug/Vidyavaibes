const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const StudentProfile = require('../models/StudentProfile');
const Progress = require('../models/Progress');
const { sendLowScoreAlert } = require('../utils/notificationHelper');
const User = require('../models/User');

/**
 * @desc    Get a quiz — adaptive: selects difficulty based on student's current level
 * @route   GET /api/quiz/get?subject=Math&topicId=xxx
 * @access  Private (student)
 */
const getQuiz = async (req, res, next) => {
  try {
    const { subject, topicId, grade } = req.query;

    // Get student's current adaptive difficulty level
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const difficulty = profile?.currentDifficulty || 1;

    const query = { isPublished: true, difficulty };
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    else if (req.user.grade) query.grade = req.user.grade;
    if (topicId) query.topicId = topicId;

    // Try to find a quiz at the current difficulty
    let quiz = await Quiz.findOne(query);

    // Fall back to any difficulty if none found
    if (!quiz) {
      delete query.difficulty;
      quiz = await Quiz.findOne(query);
    }

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for these criteria. Please try again later.',
      });
    }

    // Strip the isCorrect field from options — don't leak answers!
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      points: q.points,
      difficulty: q.difficulty,
      options: q.options.map((o) => ({
        _id: o._id,
        text: o.text,
        // isCorrect intentionally excluded
      })),
    }));

    // Check how many times student has attempted this quiz
    const attemptCount = await Result.countDocuments({
      studentId: req.user._id,
      quizId: quiz._id,
    });

    res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        grade: quiz.grade,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questions: safeQuestions,
        questionCount: safeQuestions.length,
      },
      studentDifficulty: difficulty,
      attemptCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit quiz answers and get score + adaptive difficulty update
 * @route   POST /api/quiz/submit
 * @access  Private (student)
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    // answers: [{ questionId, selectedOptionId }] for MCQ
    //          [{ questionId, selectedAnswer }] for short_answer / true_false

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // ── Grade the quiz ─────────────────────────────────────────────────────
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    for (const question of quiz.questions) {
      const studentAnswer = answers.find(
        (a) => a.questionId.toString() === question._id.toString()
      );
      totalPoints += question.points;

      let isCorrect = false;

      if (question.questionType === 'mcq' || question.questionType === 'true_false') {
        const correctOption = question.options.find((o) => o.isCorrect);
        if (
          studentAnswer &&
          correctOption &&
          studentAnswer.selectedOptionId?.toString() === correctOption._id.toString()
        ) {
          isCorrect = true;
        }
      } else if (question.questionType === 'short_answer') {
        // Case-insensitive text comparison
        if (
          studentAnswer &&
          studentAnswer.selectedAnswer?.toLowerCase().trim() ===
            question.correctAnswer?.toLowerCase().trim()
        ) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points;
      }

      gradedAnswers.push({
        questionId: question._id,
        selectedOption: studentAnswer?.selectedOptionId || studentAnswer?.selectedAnswer,
        isCorrect,
      });
    }

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercent >= quiz.passingScore;

    // ── Adaptive Difficulty Logic ─────────────────────────────────────────
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    let currentDifficulty = profile?.currentDifficulty || 1;
    let difficultyChange = 'unchanged';

    if (scorePercent >= 80 && currentDifficulty < 3) {
      currentDifficulty++;
      difficultyChange = 'increased';
    } else if (scorePercent < 50 && currentDifficulty > 1) {
      currentDifficulty--;
      difficultyChange = 'decreased';
    }

    await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { currentDifficulty }
    );

    // ── Calculate attempt number ──────────────────────────────────────────
    const prevAttempts = await Result.countDocuments({
      studentId: req.user._id,
      quizId: quiz._id,
    });

    // ── Calculate mastery score for this topic ───────────────────────────
    // Rolling average of last 3 attempts
    const recentResults = await Result.find({
      studentId: req.user._id,
      quizId: quiz._id,
    })
      .sort({ createdAt: -1 })
      .limit(2);

    const allScores = [scorePercent, ...recentResults.map((r) => r.score)];
    const masteryScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    // ── Save the result ───────────────────────────────────────────────────
    const result = await Result.create({
      studentId: req.user._id,
      quizId: quiz._id,
      topicId: quiz.topicId,
      subject: quiz.subject,
      score: scorePercent,
      correctAnswers: correctCount,
      totalQuestions: quiz.questions.length,
      timeTaken: timeTaken || 0,
      attemptNumber: prevAttempts + 1,
      difficultyLevel: quiz.difficulty,
      answers: gradedAnswers,
      passed,
      masteryScore,
    });

    // ── Update topic mastery score in Progress ────────────────────────────
    if (quiz.topicId) {
      await Progress.findOneAndUpdate(
        { studentId: req.user._id, topicId: quiz.topicId },
        { masteryScore, lastAccessedAt: new Date() }
      );

      // Also update the mastery map on StudentProfile
      await StudentProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { [`masteryScores.${quiz.subject}`]: masteryScore } }
      );
    }

    // ── Low score notification ────────────────────────────────────────────
    if (scorePercent < 50) {
      const student = await User.findById(req.user._id);
      const parentId = student.parentId || null;
      await sendLowScoreAlert(student, scorePercent, quiz.subject, parentId);
    }

    res.status(200).json({
      success: true,
      message: passed ? '🎉 Congratulations, you passed!' : 'Keep practicing, you got this!',
      result: {
        _id: result._id,
        score: scorePercent,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        passed,
        timeTaken,
        masteryScore,
        attemptNumber: prevAttempts + 1,
        difficultyChange,
        newDifficulty: currentDifficulty,
      },
      // Show correct answers for review
      review: quiz.questions.map((q) => ({
        questionText: q.questionText,
        explanation: q.explanation,
        correctAnswer: q.options.find((o) => o.isCorrect)?.text || q.correctAnswer,
        studentAnswer: gradedAnswers.find(
          (a) => a.questionId.toString() === q._id.toString()
        ),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get quiz history for a student
 * @route   GET /api/quiz/history
 * @access  Private (student)
 */
const getQuizHistory = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('quizId', 'title subject grade difficulty')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuiz, submitQuiz, getQuizHistory };
