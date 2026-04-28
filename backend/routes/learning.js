const express = require('express');
const router = express.Router();
const {
  getContent,
  getTopicById,
  markTopicComplete,
  updateProgress,
  saveNote,
  toggleBookmark,
} = require('../controllers/learningController');
const { protect, authorize } = require('../middleware/auth');

// All learning routes require student authentication
router.use(protect, authorize('student'));

// GET  /api/learning/get-content?subject=Math&grade=10
router.get('/get-content', getContent);

// GET  /api/learning/topic/:id
router.get('/topic/:id', getTopicById);

// PUT  /api/learning/complete/:topicId
router.put('/complete/:topicId', markTopicComplete);

// PUT  /api/learning/progress/:topicId
router.put('/progress/:topicId', updateProgress);

// POST /api/learning/notes/:topicId
router.post('/notes/:topicId', saveNote);

// POST /api/learning/bookmark/:topicId
router.post('/bookmark/:topicId', toggleBookmark);

module.exports = router;
