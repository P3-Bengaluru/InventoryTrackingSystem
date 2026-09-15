const { asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

const list = asyncHandler(async (req, res) => {
  const items = await notificationService.getAll(req.user.id, req.query);
  res.json({ data: await items });
});

const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(req.params.id, req.user.id);
  res.json(result);
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  res.json(result);
});

const unreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.json(result);
});

module.exports = { list, markRead, markAllRead, unreadCount };
