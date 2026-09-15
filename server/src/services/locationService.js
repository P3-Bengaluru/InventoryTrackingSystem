const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getTree() {
  const locations = await db('locations')
    .select('id', 'name', 'parent_id', 'level', 'code', 'address', 'is_active', 'created_at')
    .where({ is_active: true })
    .orderBy('level', 'asc')
    .orderBy('name', 'asc');
  return buildTree(locations, null);
}

function buildTree(flat, parentId) {
  return flat
    .filter((c) => c.parent_id === parentId || (!c.parent_id && !parentId))
    .map((c) => ({ ...c, children: buildTree(flat, c.id) }));
}

async function getByLevel(level) {
  return db('locations').where({ level, is_active: true }).orderBy('name', 'asc');
}

async function getById(id) {
  const location = await db('locations').where({ id }).first();
  if (!location) throw new AppError('Location not found', 404);
  return location;
}

async function getChildren(id) {
  return db('locations').where({ parent_id: id, is_active: true }).orderBy('name', 'asc');
}

async function create(data, req) {
  let level = 1;
  if (data.parent_id) {
    const parent = await db('locations').where({ id: data.parent_id }).first();
    if (!parent) throw new AppError('Parent location not found', 404);
    level = parent.level + 1;
    if (level > 3) throw new AppError('Maximum location depth is 3 levels', 400);
  }
  const [location] = await db('locations')
    .insert({
      name: data.name,
      parent_id: data.parent_id || null,
      level,
      code: data.code || null,
      address: level === 1 ? data.address || null : null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');
  return getById(location.id);
}

async function update(id, data, req) {
  const location = await db('locations').where({ id }).first();
  if (!location) throw new AppError('Location not found', 404);
  const updateData = { updated_at: new Date() };
  const allowed = ['name', 'code', 'address', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  await db('locations').where({ id }).update(updateData);
  return getById(id);
}

async function deactivate(id, req) {
  const children = await db('locations').where({ parent_id: id, is_active: true });
  if (children.length > 0) throw new AppError('Cannot deactivate location with active children', 400);
  await db('locations').where({ id }).update({ is_active: false, updated_at: new Date() });
  return { success: true };
}

module.exports = { getTree, getByLevel, getById, getChildren, create, update, deactivate };
