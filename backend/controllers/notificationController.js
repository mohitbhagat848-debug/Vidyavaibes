const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit = 20, page = 1 } = req.query;

    const query = { recipientId: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query, {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: skip
    });

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    });

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark ALL notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
