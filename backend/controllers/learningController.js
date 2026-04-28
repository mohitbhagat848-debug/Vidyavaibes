const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');

/**
 * @desc    Get personalized learning content for a student
 *          Filters by learning style, grade, and excludes already-completed topics
 * @route   GET /api/learning/get-content
 * @access  Private (student)
 */
const getContent = async (req, res, next) => {
  try {
    const { subject, grade } = req.query;

    // Get the student's profile to know their learning style
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const learningStyle = profile?.learningStyle || req.user.learningStyle || 'visual';

    // Build query
    const query = { isPublished: true };
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    else if (req.user.grade) query.grade = req.user.grade;

    // Fetch topics sorted by order (Using JS sort for simplicity across platforms)
    let allTopics = await Topic.find(query);
    allTopics.sort((a, b) => (a.order || 0) - (b.order || 0) || (a.difficulty || 0) - (b.difficulty || 0));

    // Get this student's progress records for these topics
    const topicIds = allTopics.map((t) => t._id);
    const progressRecords = topicIds.length > 0 ? await Progress.find({
      studentId: req.user._id,
      topicId: { $in: topicIds },
    }) : [];

    const progressMap = {};
    progressRecords.forEach((p) => {
      progressMap[p.topicId.toString()] = p;
    });

    // Enrich topics with progress info and return only the relevant content variant
    const enrichedTopics = allTopics.map((topic) => {
      const topicData = topic; // Already a plain object from our Firestore helper
      const progress = progressMap[topic._id.toString()] || null;

      // Only return the content variant for the student's learning style
      const personalizedContent = topicData.content?.[learningStyle] || topicData.content?.reading || {};

      return {
        _id: topicData._id,
        title: topicData.title,
        description: topicData.description,
        subject: topicData.subject,
        grade: topicData.grade,
        difficulty: topicData.difficulty,
        estimatedTime: topicData.estimatedTime,
        tags: topicData.tags,
        order: topicData.order,
        content: personalizedContent,
        learningStyle,
        progress: progress
          ? {
              status: progress.status,
              completionPercentage: progress.completionPercentage,
              timeSpent: progress.timeSpent,
              masteryScore: progress.masteryScore,
            }
          : { status: 'not_started', completionPercentage: 0, timeSpent: 0, masteryScore: 0 },
      };
    });

    // Separate into recommended (not completed) and completed
    const recommended = enrichedTopics.filter(
      (t) => t.progress.status !== 'completed'
    );
    const completed = enrichedTopics.filter(
      (t) => t.progress.status === 'completed'
    );

    res.status(200).json({
      success: true,
      learningStyle,
      totalTopics: allTopics.length,
      recommended,
      completed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single topic with personalized content
 * @route   GET /api/learning/topic/:id
 * @access  Private (student)
 */
const getTopicById = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const learningStyle = profile?.learningStyle || 'visual';

    // Update or initialize progress (mark as in_progress)
    await Progress.findOneAndUpdate(
      { studentId: req.user._id, topicId: topic._id },
      {
        $setOnInsert: { subject: topic.subject, startedAt: new Date() },
        $set: { status: 'in_progress', lastAccessedAt: new Date() },
        $inc: { revisitCount: 1 },
      },
      { upsert: true, new: true }
    );

    const topicData = topic.toObject();
    const personalizedContent = topicData.content?.[learningStyle] || topicData.content?.reading || {};

    res.status(200).json({
      success: true,
      topic: {
        ...topicData,
        content: personalizedContent,
        learningStyle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a topic as completed
 * @route   PUT /api/learning/complete/:topicId
 * @access  Private (student)
 */
const markTopicComplete = async (req, res, next) => {
  try {
    const { timeSpent } = req.body; // time in minutes

    const topic = await Topic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    const progress = await Progress.findOneAndUpdate(
      { studentId: req.user._id, topicId: topic._id },
      {
        status: 'completed',
        completionPercentage: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        $inc: { timeSpent: timeSpent || 0 },
        $setOnInsert: { subject: topic.subject, startedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    // Update total time spent on student profile
    if (timeSpent) {
      await StudentProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { totalTimeSpent: timeSpent } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Topic marked as completed! 🎉',
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update completion progress percentage for a topic
 * @route   PUT /api/learning/progress/:topicId
 * @access  Private (student)
 */
const updateProgress = async (req, res, next) => {
  try {
    const { completionPercentage, timeSpent } = req.body;

    const topic = await Topic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    const updateData = {
      lastAccessedAt: new Date(),
      $setOnInsert: { subject: topic.subject, startedAt: new Date() },
    };
    if (completionPercentage !== undefined) {
      updateData.completionPercentage = completionPercentage;
      updateData.status = completionPercentage >= 100 ? 'completed' : 'in_progress';
      if (completionPercentage >= 100) updateData.completedAt = new Date();
    }
    if (timeSpent) {
      updateData.$inc = { timeSpent };
      await StudentProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { totalTimeSpent: timeSpent } }
      );
    }

    const progress = await Progress.findOneAndUpdate(
      { studentId: req.user._id, topicId: topic._id },
      updateData,
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save or update a note for a topic
 * @route   POST /api/learning/notes/:topicId
 * @access  Private (student)
 */
const saveNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const topicId = req.params.topicId;

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Check if a note for this topic already exists
    const existingNoteIndex = profile.notes.findIndex(
      (n) => n.topicId.toString() === topicId
    );

    if (existingNoteIndex > -1) {
      // Update existing note
      profile.notes[existingNoteIndex].content = content;
      profile.notes[existingNoteIndex].updatedAt = new Date();
    } else {
      // Add new note
      profile.notes.push({ topicId, content });
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Note saved.',
      note: existingNoteIndex > -1 ? profile.notes[existingNoteIndex] : profile.notes[profile.notes.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle bookmark on a topic
 * @route   POST /api/learning/bookmark/:topicId
 * @access  Private (student)
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const topicId = req.params.topicId;

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const idx = profile.bookmarks.findIndex(
      (b) => b.topicId.toString() === topicId
    );

    let action;
    if (idx > -1) {
      // Remove bookmark
      profile.bookmarks.splice(idx, 1);
      action = 'removed';
    } else {
      // Add bookmark
      profile.bookmarks.push({ topicId });
      action = 'added';
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: `Bookmark ${action}.`,
      bookmarked: action === 'added',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContent,
  getTopicById,
  markTopicComplete,
  updateProgress,
  saveNote,
  toggleBookmark,
};
