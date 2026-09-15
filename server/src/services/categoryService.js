const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getTree() {
  const categories = await db('categories')
    .select('id', 'name', 'parent_id', 'type', 'asset_prefix', 'description', 'sort_order', 'is_active', 'created_at')
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc');
  return buildTree(categories, null);
}

function buildTree(flat, parentId) {
  return flat
    .filter((c) => c.parent_id === parentId || (!c.parent_id && !parentId))
    .map((c) => ({ ...c, children: buildTree(flat, c.id) }));
}

async function getById(id) {
  const category = await db('categories').where({ id }).first();
  if (!category) throw new AppError('Category not found', 404);
  return category;
}

async function getChildren(id) {
  return db('categories').where({ parent_id: id }).orderBy('sort_order', 'asc').orderBy('name', 'asc');
}

async function create(data, req) {
  if (data.parent_id) {
    const parent = await db('categories').where({ id: data.parent_id }).first();
    if (!parent) throw new AppError('Parent category not found', 404);
  }
  const [category] = await db('categories')
    .insert({
      name: data.name,
      parent_id: data.parent_id || null,
      type: 'asset',
      asset_prefix: data.asset_prefix || null,
      description: data.description || null,
      sort_order: data.sort_order || 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');
  return getById(category.id);
}

async function update(id, data, req) {
  const category = await db('categories').where({ id }).first();
  if (!category) throw new AppError('Category not found', 404);
  const updateData = { updated_at: new Date() };
  const allowed = ['name', 'description', 'sort_order', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  await db('categories').where({ id }).update(updateData);
  return getById(id);
}

async function deactivate(id, req) {
  const category = await db('categories').where({ id }).first();
  if (!category) throw new AppError('Category not found', 404);
  const children = await db('categories').where({ parent_id: id, is_active: true });
  if (children.length > 0) throw new AppError('Cannot deactivate category with active children', 400);
  await db('categories').where({ id }).update({ is_active: false, updated_at: new Date() });
  return { success: true };
}

module.exports = { getTree, getById, getChildren, create, update, deactivate };
