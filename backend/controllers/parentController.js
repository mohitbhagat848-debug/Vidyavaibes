const User = require('../models/User');
const Result = require('../models/Result');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');
const Topic = require('../models/Topic'); // if exists, to fetch topic titles

/**
 * @desc    Get parent dashboard — all linked children's data
 * @route   GET /api/parent/dashboard
 * @access  Private (parent)
 */
const getParentDashboard = async (req, res, next) => {
  try {
    const parentId = req.user._id || req.user.id;
    const parent = await User.findById(parentId);

    const childrenIds = parent.children || [];
    const childrenDocs = await Promise.all(childrenIds.map(id => User.findById(id)));
    const populatedChildren = childrenDocs.filter(c => c);

    if (!populatedChildren || populatedChildren.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No children linked to this account yet.',
        children: [],
      });
    }

    const childrenData = await Promise.all(
      populatedChildren.map(async (child) => {
        // Recent quiz results (last 10)
        const results = await Result.find({ studentId: child._id }, { sort: { createdAt: -1 }, limit: 10 });

        const avgScore =
          results.length > 0
            ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length)
            : null;

        // Progress
        const progressList = await Progress.find({ studentId: child._id });
        const completedTopics = progressList.filter((p) => p.status === 'completed').length;
        const totalTopics = progressList.length;

        // Profile
        const profile = await StudentProfile.findOne({ userId: child._id });

        // Weekly summary (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyResults = results.filter(
          (r) => new Date(r.createdAt) >= sevenDaysAgo
        );
        const weeklyAvg =
          weeklyResults.length > 0
            ? Math.round(weeklyResults.reduce((s, r) => s + (r.score || 0), 0) / weeklyResults.length)
            : null;

        // Subject breakdown for strengths/weak areas
        const subjectMap = {};
        for (const r of results) {
          if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 };
          subjectMap[r.subject].total += (r.score || 0);
          subjectMap[r.subject].count++;
        }

        const subjectScores = Object.entries(subjectMap).map(([subject, data]) => ({
          subject,
          averageScore: Math.round(data.total / data.count),
        }));

        const strengths = subjectScores.filter((s) => s.averageScore >= 70);
        const weakAreas = subjectScores.filter((s) => s.averageScore < 60);

        // ── Python Course Day-by-Day Scores ──────────────────────────────────
        const pythonResults = results.filter(r => (r.subject || '').toLowerCase() === 'python');
        const pythonDayScores = {};
        for (const r of pythonResults) {
          const dn = r.dayNumber;
          if (dn && dn >= 1 && dn <= 7) {
            if (!pythonDayScores[dn] || r.score > pythonDayScores[dn]) {
              pythonDayScores[dn] = r.score;
            }
          }
        }

        return {
          child: {
            _id: child._id,
            name: child.name,
            email: child.email,
            grade: child.grade,
            avatar: child.avatar,
            learningStyle: child.learningStyle,
            lastLogin: child.lastLogin,
            onboardingComplete: child.onboardingComplete,
          },
          overview: {
            averageScore: avgScore,
            totalQuizAttempts: results.length,
            completedTopics,
            totalTopics,
            progressPercent:
              totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
            totalTimeSpentMins: profile?.totalTimeSpent || 0,
            currentStreak: profile?.currentStreak || 0,
            currentDifficulty: profile?.currentDifficulty || 1,
          },
          pythonCourse: {
            dayScores: pythonDayScores,
            completedDays: Object.keys(pythonDayScores).length,
            totalDays: 7,
            averageScore: pythonResults.length > 0
              ? Math.round(pythonResults.reduce((s, r) => s + (r.score || 0), 0) / pythonResults.length)
              : null,
          },
          weeklySummary: {
            quizzesTaken: weeklyResults.length,
            averageScore: weeklyAvg,
            topicsCompleted: progressList.filter(
              (p) =>
                p.status === 'completed' &&
                new Date(p.completedAt) >= sevenDaysAgo
            ).length,
          },
          strengths,
          weakAreas,
          recentResults: results.slice(0, 5).map((r) => ({
            subject: r.subject,
            topic: r.topic,
            dayNumber: r.dayNumber,
            score: r.score,
            passed: r.passed,
            date: r.createdAt,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
      },
      children: childrenData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link a student to this parent account
 * @route   POST /api/parent/link-child
 * @access  Private (parent)
 */
const linkChild = async (req, res, next) => {
  try {
    const { childEmail } = req.body;

    const childrenList = await User.find({ email: childEmail });
    const child = childrenList.find(c => c.role === 'student');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'No student found with that email address.',
      });
    }

    const parentId = req.user._id || req.user.id;
    // Utilize custom addToSet helper in SupabaseModel
    await User.addToSet(parentId, 'children', child._id);
    
    // Link parent to child
    await User.findByIdAndUpdate(child._id, { parentId: parentId });

    res.status(200).json({
      success: true,
      message: `${child.name} has been linked to your account.`,
      child: { _id: child._id, name: child.name, email: child.email, grade: child.grade },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get weekly report for a specific child
 * @route   GET /api/parent/weekly-report/:childId
 * @access  Private (parent)
 */
const getWeeklyReport = async (req, res, next) => {
  try {
    const parentId = req.user._id || req.user.id;
    const parent = await User.findById(parentId);

    const isLinked = (parent.children || []).includes(req.params.childId);

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not linked to your account.',
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const child = await User.findById(req.params.childId);

    // Filter results using JS due to complex queries in simplistic Supabase wrapper
    const allRecentResults = await Result.find({ studentId: child._id }, { sort: { createdAt: -1 } });
    const weeklyResults = allRecentResults.filter(r => new Date(r.createdAt) >= sevenDaysAgo);

    const allProgress = await Progress.find({ studentId: child._id });
    const weeklyProgress = allProgress.filter(p => p.status === 'completed' && p.completedAt && new Date(p.completedAt) >= sevenDaysAgo);

    // Mock populate topicId
    const populatedProgress = await Promise.all(weeklyProgress.map(async (p) => {
      let title = 'Unknown';
      let subject = p.subject;
      if (p.topicId) {
        try {
          // If Topic model is usable
          const topic = await Topic.findById(p.topicId);
          if (topic) {
            title = topic.title;
            subject = topic.subject || subject;
          }
        } catch(e) {}
      }
      return { topic: title, subject, completedAt: p.completedAt };
    }));

    const profile = await StudentProfile.findOne({ userId: child._id });

    const avgScore =
      weeklyResults.length > 0
        ? Math.round(weeklyResults.reduce((s, r) => s + (r.score || 0), 0) / weeklyResults.length)
        : null;

    // Day-by-day activity this week
    const dailyActivity = {};
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayKey = day.toISOString().split('T')[0];
      dailyActivity[dayKey] = { quizzes: 0, avgScore: null, scores: [] };
    }

    for (const r of weeklyResults) {
      const dayKey = new Date(r.createdAt).toISOString().split('T')[0];
      if (dailyActivity[dayKey]) {
        dailyActivity[dayKey].quizzes++;
        dailyActivity[dayKey].scores.push(r.score || 0);
      }
    }

    // Compute daily averages
    for (const day of Object.keys(dailyActivity)) {
      const scores = dailyActivity[day].scores;
      if (scores.length > 0) {
        dailyActivity[day].avgScore = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
      }
      delete dailyActivity[day].scores;
    }

    res.status(200).json({
      success: true,
      weeklyReport: {
        child: { _id: child._id, name: child.name, grade: child.grade },
        summary: {
          quizzesTaken: weeklyResults.length,
          averageScore: avgScore,
          topicsCompleted: weeklyProgress.length,
          timeSpentThisWeek: '(tracked per session)',
          currentStreak: profile?.currentStreak || 0,
        },
        topicsCompleted: populatedProgress,
        dailyActivity,
        results: weeklyResults.map((r) => ({
          subject: r.subject,
          score: r.score,
          passed: r.passed,
          date: r.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getParentDashboard, linkChild, getWeeklyReport };
