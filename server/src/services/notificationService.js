const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getAll(userId, filters = {}) {
  const query = db('notifications')
    .select('*')
    .where(function () {
      this.where({ user_id: userId }).orWhereNull('user_id');
    });
  if (filters.unread === 'true') query.andWhere({ is_read: false });
  query.orderBy('created_at', 'desc');
  return query;
}

async function markRead(id, userId) {
  const notification = await db('notifications').where({ id }).first();
  if (!notification) throw new AppError('Notification not found', 404);
  await db('notifications').where({ id }).update({ is_read: true, read_at: new Date() });
  return { success: true };
}

async function markAllRead(userId) {
  await db('notifications')
    .where(function () {
      this.where({ user_id: userId }).orWhereNull('user_id');
    })
    .where({ is_read: false })
    .update({ is_read: true, read_at: new Date() });
  return { success: true };
}

async function getUnreadCount(userId) {
  const result = await db('notifications')
    .where(function () {
      this.where({ user_id: userId }).orWhereNull('user_id');
    })
    .where({ is_read: false })
    .count('* as count')
    .first();
  return { count: parseInt(result.count, 10) };
}

module.exports = { getAll, markRead, markAllRead, getUnreadCount };
