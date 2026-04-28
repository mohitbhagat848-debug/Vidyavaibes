const Notification = require('../models/Notification');

/**
 * Creates a notification in the database
 * @param {Object} params
 * @param {string} params.recipientId - User receiving the notification
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Short title
 * @param {string} params.message - Full message body
 * @param {Object} [params.data] - Optional extra payload
 * @param {number} [params.priority] - 1=low, 2=medium, 3=high
 * @param {string} [params.senderId] - Who triggered it (null = system)
 */
const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  data = {},
  priority = 1,
  senderId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      title,
      message,
      data,
      priority,
    });
    return notification;
  } catch (err) {
    // Non-critical — log but don't crash the main request
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Creates a low-score alert and optionally notifies parent
 * @param {Object} student - User document
 * @param {number} score - Quiz score percentage
 * @param {string} subject - Subject name
 * @param {string|null} parentId - Parent user ID to notify
 */
const sendLowScoreAlert = async (student, score, subject, parentId = null) => {
  // Alert the student
  await createNotification({
    recipientId: student._id,
    type: 'low_score',
    title: 'Low Quiz Score Alert',
    message: `You scored ${score}% in ${subject}. Review the material and try again!`,
    data: { score, subject },
    priority: 2,
  });

  // Alert the parent if linked
  if (parentId) {
    await createNotification({
      recipientId: parentId,
      type: 'parent_alert',
      title: `${student.name} scored low in ${subject}`,
      message: `${student.name} scored ${score}% on their latest ${subject} quiz. Consider checking in with them.`,
      data: { studentId: student._id, score, subject },
      priority: 2,
    });
  }
};

/**
 * Creates an inactivity alert for a student
 * @param {Object} student - User document
 * @param {number} daysSinceActive - Days since last login/activity
 */
const sendInactivityAlert = async (student, daysSinceActive) => {
  await createNotification({
    recipientId: student._id,
    type: 'inactivity',
    title: "We miss you! 📚",
    message: `You haven't logged in for ${daysSinceActive} days. Jump back in and keep your streak going!`,
    data: { daysSinceActive },
    priority: 1,
  });
};

module.exports = {
  createNotification,
  sendLowScoreAlert,
  sendInactivityAlert,
};
