const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');
const { createNotification } = require('../utils/notifications');

async function getAll(filters = {}) {
  const query = db('reallocations')
    .select(
      'reallocations.*',
      'a.asset_number',
      'a.name as asset_name',
      'fu.name as from_user_name',
      'tu.name as to_user_name',
      'rb.name as requested_by_name',
      'ab.name as approver_name'
    )
    .leftJoin('assets as a', 'reallocations.asset_id', 'a.id')
    .leftJoin('users as fu', 'reallocations.from_user_id', 'fu.id')
    .leftJoin('users as tu', 'reallocations.to_user_id', 'tu.id')
    .leftJoin('users as rb', 'reallocations.requested_by', 'rb.id')
    .leftJoin('users as ab', 'reallocations.approved_by', 'ab.id');

  if (filters.status) query.andWhere({ 'reallocations.status': filters.status });
  if (filters.asset_id) query.andWhere({ 'reallocations.asset_id': filters.asset_id });

  query.orderBy('reallocations.created_at', 'desc');
  return query;
}

async function getById(id) {
  const reallocation = await db('reallocations')
    .select(
      'reallocations.*',
      'a.asset_number',
      'a.name as asset_name',
      'fu.name as from_user_name',
      'tu.name as to_user_name',
      'rb.name as requested_by_name',
      'ab.name as approver_name'
    )
    .leftJoin('assets as a', 'reallocations.asset_id', 'a.id')
    .leftJoin('users as fu', 'reallocations.from_user_id', 'fu.id')
    .leftJoin('users as tu', 'reallocations.to_user_id', 'tu.id')
    .leftJoin('users as rb', 'reallocations.requested_by', 'rb.id')
    .leftJoin('users as ab', 'reallocations.approved_by', 'ab.id')
    .where({ 'reallocations.id': id })
    .first();
  if (!reallocation) throw new AppError('Reallocation not found', 404);
  return reallocation;
}

async function create(data, req) {
  const asset = await db('assets').where({ id: data.asset_id, is_active: true }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  if (asset.status !== 'assigned') throw new AppError('Asset must be assigned to reallocate', 400);
  if (!asset.assigned_to) throw new AppError('Asset has no current assignee', 400);

  const fromUser = await db('users').where({ id: asset.assigned_to }).first();
  if (!fromUser) throw new AppError('Current assignee not found', 404);

  const toUser = await db('users').where({ id: data.to_user_id, is_active: true }).first();
  if (!toUser) throw new AppError('Target user not found', 404);

  if (asset.assigned_to === data.to_user_id) throw new AppError('Cannot reallocate to the same user', 400);

  const existingPending = await db('reallocations')
    .where({ asset_id: data.asset_id, status: 'pending' })
    .first();
  if (existingPending) throw new AppError('A pending reallocation already exists for this asset', 409);

  const [reallocation] = await db('reallocations')
    .insert({
      asset_id: data.asset_id,
      from_user_id: asset.assigned_to,
      to_user_id: data.to_user_id,
      status: 'pending',
      requested_by: req.user.id,
      reason: data.reason || null,
      notes: data.notes || null,
      requested_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');

  const created = await getById(reallocation.id);

  const pms = await db('users')
    .whereIn('role', ['project_manager', 'admin'])
    .andWhere({ is_active: true })
    .select('id');
  for (const pm of pms) {
    await createNotification({
      userId: pm.id,
      type: 'reallocation_request',
      title: 'Reallocation Request',
      message: `Reallocation requested for asset ${asset.asset_number}`,
      entityType: 'reallocation',
      entityId: reallocation.id,
    });
  }

  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'REALLOCATE_REQUEST',
      entity_type: 'reallocation',
      entity_id: reallocation.id,
      after_value: created,
    });
  }
  return created;
}

async function approve(id, req) {
  const reallocation = await db('reallocations').where({ id }).first();
  if (!reallocation) throw new AppError('Reallocation not found', 404);
  if (reallocation.status !== 'pending') throw new AppError('Reallocation is not pending', 400);

  const asset = await db('assets').where({ id: reallocation.asset_id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  if (asset.status !== 'assigned') throw new AppError('Asset is no longer assigned', 400);

  await db.transaction(async (trx) => {
    await trx('reallocations').where({ id }).update({
      status: 'approved',
      approved_by: req.user.id,
      approver_role: req.user.role,
      approved_at: new Date(),
      completed_at: new Date(),
      updated_at: new Date(),
    });
    await trx('assets').where({ id: reallocation.asset_id }).update({
      assigned_to: reallocation.to_user_id,
      assigned_since: new Date().toISOString().split('T')[0],
      updated_at: new Date(),
    });
  });

  await createNotification({
    userId: reallocation.to_user_id,
    type: 'reallocation_approved',
    title: 'Asset Reallocated to You',
    message: `Asset ${asset.asset_number} has been reallocated to you.`,
    entityType: 'reallocation',
    entityId: id,
  });

  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'REALLOCATE_APPROVE',
      entity_type: 'reallocation',
      entity_id: id,
      after_value: updated,
    });
  }
  return updated;
}

async function reject(id, rejectionReason, req) {
  const reallocation = await db('reallocations').where({ id }).first();
  if (!reallocation) throw new AppError('Reallocation not found', 404);
  if (reallocation.status !== 'pending') throw new AppError('Reallocation is not pending', 400);

  await db('reallocations').where({ id }).update({
    status: 'rejected',
    approved_by: req.user.id,
    approver_role: req.user.role,
    rejection_reason: rejectionReason || null,
    updated_at: new Date(),
  });

  await createNotification({
    userId: reallocation.requested_by,
    type: 'reallocation_rejected',
    title: 'Reallocation Rejected',
    message: `Reallocation request for asset has been rejected.`,
    entityType: 'reallocation',
    entityId: id,
  });

  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'REALLOCATE_REJECT',
      entity_type: 'reallocation',
      entity_id: id,
      after_value: updated,
    });
  }
  return updated;
}

module.exports = {
  getAll,
  getById,
  create,
  approve,
  reject,
};
