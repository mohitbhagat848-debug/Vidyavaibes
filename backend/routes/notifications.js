const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET    /api/notifications?unreadOnly=true&page=1&limit=20
router.get('/', getNotifications);

// PUT    /api/notifications/read-all
router.put('/read-all', markAllAsRead);

// PUT    /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

module.exports = router;
