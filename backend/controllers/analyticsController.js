const User = require('../models/User');
const Result = require('../models/Result');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');

/**
 * @desc    Get analytics for the logged-in student
 * @route   GET /api/analytics/student
 * @access  Private (student)
 */
const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // ── Quiz performance ──────────────────────────────────────────────────
    const allResults = await Result.find({ studentId }).sort({ createdAt: -1 });

    const totalQuizzes = allResults.length;
    const avgScore =
      totalQuizzes > 0
        ? Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / totalQuizzes)
        : 0;
    const passedQuizzes = allResults.filter((r) => r.passed).length;
    const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

    // Subject-wise average scores
    const subjectScores = {};
    for (const result of allResults) {
      if (!subjectScores[result.subject]) {
        subjectScores[result.subject] = { total: 0, count: 0 };
      }
      subjectScores[result.subject].total += result.score;
      subjectScores[result.subject].count++;
    }
    const subjectAverages = Object.entries(subjectScores).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.total / data.count),
      attempts: data.count,
    }));

    // ── Learning progress ─────────────────────────────────────────────────
    const allProgress = await Progress.find({ studentId });
    const totalTopics = allProgress.length;
    const completedTopics = allProgress.filter((p) => p.status === 'completed').length;
    const inProgressTopics = allProgress.filter((p) => p.status === 'in_progress').length;
    const overallProgress =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const totalTimeSpentMins = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // ── Student profile data ──────────────────────────────────────────────
    const profile = await StudentProfile.findOne({ userId: studentId });
    const masteryScores = profile?.masteryScores
      ? Object.fromEntries(profile.masteryScores)
      : {};

    // ── Recent activity (last 7 days) ─────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentResults = allResults.filter(
      (r) => new Date(r.createdAt) >= sevenDaysAgo
    );
    const weeklyQuizzes = recentResults.length;
    const weeklyAvgScore =
      weeklyQuizzes > 0
        ? Math.round(recentResults.reduce((sum, r) => sum + r.score, 0) / weeklyQuizzes)
        : 0;

    // ── Mastery score (overall) ───────────────────────────────────────────
    const masteryValues = Object.values(masteryScores);
    const overallMastery =
      masteryValues.length > 0
        ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length)
        : 0;

    // ── Strengths and weak areas ──────────────────────────────────────────
    const strengths = subjectAverages.filter((s) => s.averageScore >= 70);
    const weakAreas = subjectAverages.filter((s) => s.averageScore < 60);

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalQuizzes,
          avgScore,
          passRate,
          overallProgress,
          totalTimeSpentMins,
          overallMastery,
          currentStreak: profile?.currentStreak || 0,
          currentDifficulty: profile?.currentDifficulty || 1,
          learningStyle: profile?.learningStyle || req.user.learningStyle,
        },
        topics: {
          total: totalTopics,
          completed: completedTopics,
          inProgress: inProgressTopics,
          notStarted: totalTopics - completedTopics - inProgressTopics,
        },
        weekly: {
          quizzesTaken: weeklyQuizzes,
          averageScore: weeklyAvgScore,
        },
        subjectBreakdown: subjectAverages,
        masteryScores,
        strengths,
        weakAreas,
        recentResults: allResults.slice(0, 5).map((r) => ({
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

/**
 * @desc    Get class-wide analytics for a teacher
 * @route   GET /api/analytics/teacher
 * @access  Private (teacher)
 */
const getTeacherAnalytics = async (req, res, next) => {
  try {
    // Get all students in the system (or filtered by grade)
    const { grade, subject } = req.query;
    const query = { role: 'student', isActive: true };
    if (grade) query.grade = grade;

    const students = await User.find(query).select('_id name email grade learningStyle');
    const studentIds = students.map((s) => s._id);

    // Get all quiz results for these students
    const resultQuery = { studentId: { $in: studentIds } };
    if (subject) resultQuery.subject = subject;

    const allResults = await Result.find(resultQuery);

    // Class average score
    const classAvgScore =
      allResults.length > 0
        ? Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length)
        : 0;

    // Per-student summary
    const studentSummaries = await Promise.all(
      students.map(async (student) => {
        const studentResults = allResults.filter(
          (r) => r.studentId.toString() === student._id.toString()
        );
        const studentAvg =
          studentResults.length > 0
            ? Math.round(
                studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length
              )
            : null;

        const profile = await StudentProfile.findOne({ userId: student._id });
        const progressRecords = await Progress.find({ studentId: student._id });
        const completedCount = progressRecords.filter((p) => p.status === 'completed').length;

        // At-risk: avg score < 60 OR no activity in 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentActivity = studentResults.filter(
          (r) => new Date(r.createdAt) >= sevenDaysAgo
        ).length;
        const isAtRisk = (studentAvg !== null && studentAvg < 60) || recentActivity === 0;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          grade: student.grade,
          learningStyle: student.learningStyle,
          averageScore: studentAvg,
          totalAttempts: studentResults.length,
          completedTopics: completedCount,
          totalTimeSpent: profile?.totalTimeSpent || 0,
          currentDifficulty: profile?.currentDifficulty || 1,
          recentActivity,
          isAtRisk,
        };
      })
    );

    // Subject-wise class performance
    const subjectMap = {};
    for (const r of allResults) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 };
      subjectMap[r.subject].total += r.score;
      subjectMap[r.subject].count++;
    }
    const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      classAverage: Math.round(data.total / data.count),
      attempts: data.count,
    }));

    const atRiskStudents = studentSummaries.filter((s) => s.isAtRisk);

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalStudents: students.length,
          classAverageScore: classAvgScore,
          atRiskCount: atRiskStudents.length,
          totalQuizAttempts: allResults.length,
        },
        students: studentSummaries,
        atRiskStudents,
        subjectPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudentAnalytics, getTeacherAnalytics };
