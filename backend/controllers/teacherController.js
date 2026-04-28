const User = require('../models/User');
const Result = require('../models/Result');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Get teacher dashboard overview — all students with performance
 * @route   GET /api/teacher/dashboard?grade=10&subject=Math
 * @access  Private (teacher)
 */
const getTeacherDashboard = async (req, res, next) => {
  try {
    const { grade, subject } = req.query;

    // Build user query — supabaseModel.find() accepts plain key:value pairs
    const userQuery = { role: 'student', isActive: true };
    if (grade) userQuery.grade = grade;

    // Fetch all matching students
    const students = await User.find(userQuery);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const studentData = await Promise.all(
      students.map(async (student) => {
        const studentId = student.id || student._id;

        // Fetch quiz results for this student
        const resultQuery = { studentId };
        if (subject) resultQuery.subject = subject;
        const allResults = await Result.find(resultQuery, { sort: { createdAt: -1 }, limit: 20 });

        const avgScore =
          allResults.length > 0
            ? Math.round(allResults.reduce((s, r) => s + (r.score || 0), 0) / allResults.length)
            : null;

        // Fetch student profile
        const profile = await StudentProfile.findOne({ userId: studentId });

        // Fetch progress
        const progressList = await Progress.find({ studentId });
        const completedTopics = progressList.filter((p) => p.status === 'completed').length;
        const totalTopics = progressList.length;
        const progressPercent =
          totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        // Recent quiz activity this week
        const recentQuizzes = allResults.filter(
          (r) => r.createdAt && new Date(r.createdAt) >= sevenDaysAgo
        ).length;

        const daysSinceLogin = student.lastLogin
          ? Math.floor((Date.now() - new Date(student.lastLogin)) / (1000 * 60 * 60 * 24))
          : null;

        const isAtRisk =
          (avgScore !== null && avgScore < 60) ||
          recentQuizzes === 0 ||
          (daysSinceLogin !== null && daysSinceLogin > 7);

        // ── Python Course Day-by-Day Scores ──────────────────────────────────
        const pythonResults = allResults.filter(r => (r.subject || '').toLowerCase() === 'python');
        const pythonDayScores = {};
        for (const r of pythonResults) {
          // dayNumber is stored in the JSONB answers metadata
          const meta = Array.isArray(r.answers) && r.answers.length > 0 ? r.answers[0] : null;
          const dn = meta?.dayNumber || r.dayNumber;
          if (dn && dn >= 1 && dn <= 7) {
            // Keep the latest/best score per day
            if (!pythonDayScores[dn] || r.score > pythonDayScores[dn]) {
              pythonDayScores[dn] = r.score;
            }
          }
        }

        return {
          _id: studentId,
          id: studentId,
          name: student.name,
          email: student.email,
          grade: student.grade,
          avatar: student.avatar,
          learningStyle: student.learningStyle,
          lastLogin: student.lastLogin,
          daysSinceLogin,
          performance: {
            averageScore: avgScore,
            totalAttempts: allResults.length,
            recentQuizzes,
            progressPercent,
            completedTopics,
            totalTopics,
          },
          pythonCourse: {
            dayScores: pythonDayScores,       // { 1: 80, 2: 60, ... }
            completedDays: Object.keys(pythonDayScores).length,
            totalDays: 7,
            averageScore: pythonResults.length > 0
              ? Math.round(pythonResults.reduce((s, r) => s + (r.score || 0), 0) / pythonResults.length)
              : null,
          },
          profile: {
            currentDifficulty: profile?.currentDifficulty || 1,
            currentStreak: profile?.currentStreak || 0,
            totalTimeSpent: profile?.totalTimeSpent || 0,
          },
          isAtRisk,
          riskReasons: [
            ...(avgScore !== null && avgScore < 60 ? [`Low avg score: ${avgScore}%`] : []),
            ...(recentQuizzes === 0 ? ['No quiz activity this week'] : []),
            ...(daysSinceLogin !== null && daysSinceLogin > 7 ? [`Inactive for ${daysSinceLogin} days`] : []),
          ],
        };
      })
    );

    // Summary stats
    const totalStudents = studentData.length;
    const atRiskStudents = studentData.filter((s) => s.isAtRisk);
    const activeThisWeek = studentData.filter((s) => s.performance.recentQuizzes > 0);
    const allScores = studentData
      .map((s) => s.performance.averageScore)
      .filter((s) => s !== null);
    const classAvg =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        summary: {
          totalStudents,
          atRiskCount: atRiskStudents.length,
          activeThisWeek: activeThisWeek.length,
          classAverageScore: classAvg,
          engagementRate:
            totalStudents > 0
              ? Math.round((activeThisWeek.length / totalStudents) * 100)
              : 0,
        },
        students: studentData,
        atRiskStudents,
      },
    });
  } catch (error) {
    console.error('[teacherController] getTeacherDashboard error:', error.message);
    next(error);
  }
};

/**
 * @desc    Get a single student's detailed performance (for teacher view)
 * @route   GET /api/teacher/student/:studentId
 * @access  Private (teacher)
 */
const getStudentPerformance = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const studentId = student.id || student._id;

    // All results for this student (sorted by date desc, limit 20)
    const results = await Result.find(
      { studentId },
      { sort: { createdAt: -1 }, limit: 20 }
    );

    const profile = await StudentProfile.findOne({ userId: studentId });
    const progressList = await Progress.find({ studentId });

    // Subject breakdown — group results by subject
    const subjectMap = {};
    for (const r of results) {
      const subj = r.subject || 'General';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { scores: [], attempts: 0 };
      }
      subjectMap[subj].scores.push(r.score || 0);
      subjectMap[subj].attempts++;
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      attempts: data.attempts,
      bestScore: Math.max(...data.scores),
      lowestScore: Math.min(...data.scores),
    }));

    res.status(200).json({
      success: true,
      student: {
        _id: studentId,
        name: student.name,
        email: student.email,
        grade: student.grade,
        learningStyle: student.learningStyle,
        lastLogin: student.lastLogin,
      },
      profile,
      results: results.slice(0, 20),
      progress: progressList,
      subjectBreakdown,
    });
  } catch (error) {
    console.error('[teacherController] getStudentPerformance error:', error.message);
    next(error);
  }
};

/**
 * @desc    Send a notification/message to a student from teacher
 * @route   POST /api/teacher/notify/:studentId
 * @access  Private (teacher)
 */
const notifyStudent = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await createNotification({
      recipientId: student.id || student._id,
      senderId: req.user.id || req.user._id,
      type: 'teacher_message',
      title,
      message,
      priority: 2,
    });

    res.status(200).json({
      success: true,
      message: `Notification sent to ${student.name}.`,
    });
  } catch (error) {
    console.error('[teacherController] notifyStudent error:', error.message);
    next(error);
  }
};

/**
 * @desc    Sync student course progress from frontend localStorage to Supabase
 * @route   POST /api/teacher/sync-progress
 * @access  Private (student — called automatically when a quiz is completed)
 */
const syncStudentProgress = async (req, res, next) => {
  try {
    const { subject, topic, dayNumber, score, quizScore, totalQuestions, passed, timeTaken, courseId } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!subject || score === undefined) {
      return res.status(400).json({ success: false, message: 'subject and score are required.' });
    }

    // 1. Save result record
    // Check by looking at existing results with same subject and matching dayNumber in metadata
    const existing = await Result.find({ studentId, subject });
    const alreadySynced = existing.some(r => {
      // Check if dayNumber is stored in answers metadata
      const meta = r.answers;
      if (Array.isArray(meta) && meta.length > 0 && meta[0]?.dayNumber === dayNumber) return true;
      // Fallback: check if a result with same topic exists
      return false;
    });

    if (!alreadySynced) {
      await Result.create({
        studentId,
        subject,
        score,
        // Store quiz-specific fields in columns that exist in the schema
        correctAnswers: quizScore || 0,
        totalQuestions: totalQuestions || 0,
        timeTaken: timeTaken || 0,
        passed: passed || false,
        attemptNumber: existing.length + 1,
        difficultyLevel: 1,
        masteryScore: score,
        // Store dayNumber, topic, courseId as metadata in the JSONB answers column
        answers: [{ dayNumber, topic: topic || subject, courseId: courseId || null, quizScore: quizScore || 0 }],
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Update StudentProfile total time spent
    if (timeTaken) {
      const profile = await StudentProfile.findOne({ userId: studentId });
      if (profile) {
        const newTime = (profile.totalTimeSpent || 0) + timeTaken;
        await StudentProfile.findOneAndUpdate({ userId: studentId }, { totalTimeSpent: newTime });
      } else {
        await StudentProfile.create({ userId: studentId, totalTimeSpent: timeTaken });
      }
    }

    // 3. Update lastLogin on user to mark as recently active
    await User.findByIdAndUpdate(studentId, { lastLogin: new Date().toISOString() });

    res.status(200).json({ success: true, message: 'Progress synced.' });
  } catch (error) {
    console.error('[teacherController] syncStudentProgress error:', error.message);
    next(error);
  }
};

module.exports = { getTeacherDashboard, getStudentPerformance, notifyStudent, syncStudentProgress };
