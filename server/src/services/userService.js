const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { hashPassword, comparePassword } = require('./authService');
const { auditFromReq } = require('../utils/audit');

async function getAll(filters = {}) {
  const query = db('users').select(
    'id',
    'employee_id',
    'name',
    'email',
    'role',
    'manager_id',
    'department',
    'designation',
    'phone',
    'self_approve_limit',
    'budget_limit',
    'is_active',
    'last_login_at',
    'created_at'
  );

  if (filters.role) query.where({ role: filters.role });
  if (filters.is_active !== undefined) query.where({ is_active: filters.is_active });
  if (filters.department) query.whereILike('department', `%${filters.department}%`);
  if (filters.search) {
    query.where(function () {
      this.whereILike('name', `%${filters.search}%`).orWhereILike('email', `%${filters.search}%`).orWhereILike('employee_id', `%${filters.search}%`);
    });
  }

  query.orderBy('name', 'asc');
  return query;
}

async function getById(id) {
  const user = await db('users')
    .select(
      'id',
      'employee_id',
      'name',
      'email',
      'role',
      'manager_id',
      'department',
      'designation',
      'phone',
      'self_approve_limit',
      'budget_limit',
      'is_active',
      'last_login_at',
      'created_at',
      'updated_at'
    )
    .where({ id })
    .first();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function create(data, req) {
  const existing = await db('users').where({ email: data.email.toLowerCase() }).first();
  if (existing) throw new AppError('Email already in use', 409);

  const existingEmp = await db('users').where({ employee_id: data.employee_id }).first();
  if (existingEmp) throw new AppError('Employee ID already in use', 409);

  const passwordHash = await hashPassword(data.password || 'Welcome@123');

  const [user] = await db('users')
    .insert({
      employee_id: data.employee_id,
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      role: data.role || 'engineer',
      manager_id: data.manager_id || null,
      department: data.department || null,
      designation: data.designation || null,
      phone: data.phone || null,
      self_approve_limit: data.self_approve_limit || 0,
      budget_limit: data.budget_limit || 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');

  const created = await getById(user.id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CREATE',
      entity_type: 'user',
      entity_id: user.id,
      after_value: created,
    });
  }
  return created;
}

async function update(id, data, req) {
  const user = await db('users').where({ id }).first();
  if (!user) throw new AppError('User not found', 404);

  const before = { ...user };
  const updateData = {};
  const allowed = [
    'name',
    'role',
    'manager_id',
    'department',
    'designation',
    'phone',
    'self_approve_limit',
    'budget_limit',
    'is_active',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  if (data.email) {
    const existing = await db('users').where({ email: data.email.toLowerCase() }).whereNot({ id }).first();
    if (existing) throw new AppError('Email already in use', 409);
    updateData.email = data.email.toLowerCase();
  }
  if (data.employee_id) {
    const existingEmp = await db('users').where({ employee_id: data.employee_id }).whereNot({ id }).first();
    if (existingEmp) throw new AppError('Employee ID already in use', 409);
    updateData.employee_id = data.employee_id;
  }
  updateData.updated_at = new Date();

  await db('users').where({ id }).update(updateData);
  const updated = await getById(id);

  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: id,
      before_value: before,
      after_value: updated,
    });
  }
  return updated;
}

async function changePassword(userId, oldPassword, newPassword, req) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new AppError('User not found', 404);
  const match = await comparePassword(oldPassword, user.password_hash);
  if (!match) throw new AppError('Current password is incorrect', 400);
  const newHash = await hashPassword(newPassword);
  await db('users').where({ id: userId }).update({ password_hash: newHash, updated_at: new Date() });
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'SETTINGS_CHANGE',
      entity_type: 'user',
      entity_id: userId,
      description: 'Password changed',
    });
  }
  return { success: true };
}

async function adminResetPassword(userId, newPassword, req) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new AppError('User not found', 404);
  const newHash = await hashPassword(newPassword);
  await db('users').where({ id: userId }).update({ password_hash: newHash, updated_at: new Date() });
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'SETTINGS_CHANGE',
      entity_type: 'user',
      entity_id: userId,
      description: 'Admin reset password',
    });
  }
  return { success: true };
}

async function toggleActive(userId, req) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new AppError('User not found', 404);
  const newActive = !user.is_active;
  await db('users').where({ id: userId }).update({ is_active: newActive, updated_at: new Date() });
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: userId,
      description: `User ${newActive ? 'activated' : 'deactivated'}`,
    });
  }
  return { id: userId, is_active: newActive };
}

async function getAssignedAssets(userId) {
  return db('assets')
    .select(
      'assets.id',
      'assets.asset_number',
      'assets.name',
      'assets.status',
      'assets.brand',
      'assets.model',
      'assets.photo_url',
      'assets.warranty_expiry',
      'categories.name as category_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .where({ 'assets.assigned_to': userId, 'assets.is_active': true })
    .orderBy('assets.name', 'asc');
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  changePassword,
  adminResetPassword,
  toggleActive,
  getAssignedAssets,
};
