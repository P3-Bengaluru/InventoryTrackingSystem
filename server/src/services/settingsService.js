const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getAll() {
  return db('system_settings').select('key', 'value', 'type', 'description', 'is_secret', 'updated_at');
}

async function getPublic() {
  return db('system_settings')
    .select('key', 'value', 'type', 'description')
    .where({ is_secret: false });
}

async function get(key) {
  const setting = await db('system_settings').where({ key }).first();
  return setting ? setting.value : null;
}

async function update(key, value, userId) {
  const setting = await db('system_settings').where({ key }).first();
  if (!setting) throw new AppError('Setting not found', 404);
  await db('system_settings').where({ key }).update({
    value: String(value),
    updated_at: new Date(),
    updated_by: userId,
  });
  return db('system_settings').where({ key }).first();
}

module.exports = { getAll, getPublic, get, update };
