const { db } = require('../models/db');

async function createNotification({ userId, type, title, message, entityType, entityId }) {
  try {
    if (!userId) {
      const admins = await db('users').where({ role: 'admin', is_active: true }).select('id');
      const rows = admins.map((a) => ({
        user_id: a.id,
        type,
        title,
        message,
        entity_type: entityType || null,
        entity_id: entityId || null,
      }));
      if (rows.length > 0) {
        await db('notifications').insert(rows);
      }
      return;
    }
    await db('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      entity_type: entityType || null,
      entity_id: entityId || null,
    });
  } catch (err) {
    console.error('[Notifications] Failed to create:', err.message);
  }
}

module.exports = { createNotification };
