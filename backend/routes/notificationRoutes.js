const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All notification routes require authentication (any role)
router.use(protect);

/**
 * GET /api/notifications?unreadOnly=true&page=1&limit=20
 * Paginated list of notifications for the logged-in user
 */
router.get('/', getNotifications);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 * NOTE: This route must be placed BEFORE /:id routes to avoid conflicts
 */
router.put('/read-all', markAllAsRead);

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  validate,
  markAsRead
);

/**
 * DELETE /api/notifications/:id
 * Delete a single notification (only by the recipient)
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  validate,
  deleteNotification
);

module.exports = router;
