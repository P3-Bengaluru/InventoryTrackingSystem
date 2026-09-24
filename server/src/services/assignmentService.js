const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');
const { createNotification } = require('../utils/notifications');

function getAll(filters = {}) {
  const query = db('assignments')
    .select(
      'assignments.*',
      'a.asset_number',
      'a.name as asset_name',
      'u.name as user_name',
      'u.employee_id as user_employee_id',
      'ap.name as approver_name'
    )
    .leftJoin('assets as a', 'assignments.asset_id', 'a.id')
    .leftJoin('users as u', 'assignments.user_id', 'u.id')
    .leftJoin('users as ap', 'assignments.approved_by', 'ap.id');

  if (filters.status) {
    query.andWhere({
      'assignments.status': filters.status,
    });
  }

  if (filters.asset_id) {
    query.andWhere({
      'assignments.asset_id': filters.asset_id,
    });
  }

  if (filters.user_id) {
    query.andWhere({
      'assignments.user_id': filters.user_id,
    });
  }

  query.orderBy('assignments.created_at', 'desc');

  return query;
}

async function getById(id) {
  const assignment = await db('assignments')
    .select(
      'assignments.*',
      'a.asset_number',
      'a.name as asset_name',
      'u.name as user_name',
      'u.employee_id as user_employee_id',
      'ap.name as approver_name'
    )
    .leftJoin('assets as a', 'assignments.asset_id', 'a.id')
    .leftJoin('users as u', 'assignments.user_id', 'u.id')
    .leftJoin('users as ap', 'assignments.approved_by', 'ap.id')
    .where({
      'assignments.id': id,
    })
    .first();

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  return assignment;
}

async function create(data, req) {
  // Validate asset
  const asset = await db('assets')
    .where({
      id: data.asset_id,
      is_active: true,
    })
    .first();

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  if (asset.status === 'assigned') {
    throw new AppError('Asset is already assigned', 400);
  }

  if (asset.status === 'maintenance') {
    throw new AppError('Asset is under maintenance', 400);
  }

  if (asset.status === 'retired' || asset.status === 'disposed') {
    throw new AppError('Asset is not available', 400);
  }

  // Validate user
  const user = await db('users')
    .where({
      id: data.user_id,
      is_active: true,
    })
    .first();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Create assignment request
  const [assignment] = await db('assignments')
    .insert({
      asset_id: data.asset_id,
      user_id: data.user_id,
      status: 'pending',
      requested_at: new Date(),
      request_reason: data.request_reason || null,
      expected_return: data.expected_return || null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');

  const created = await getById(assignment.id);

  // Notify admins and inventory managers
  const admins = await db('users')
    .whereIn('role', ['admin', 'inventory_manager'])
    .andWhere({
      is_active: true,
    })
    .select('id');

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'assignment_request',
      title: 'New Assignment Request',
      message: `${user.name} requested asset ${asset.asset_number}`,
      entityType: 'assignment',
      entityId: assignment.id,
    });
  }

  // Audit
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CHECKOUT_REQUEST',
      entity_type: 'assignment',
      entity_id: assignment.id,
      after_value: created,
    });
  }

  return created;
}

async function approve(id, req) {
  const assignment = await db('assignments')
    .where({
      id,
    })
    .first();

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.status !== 'pending') {
    throw new AppError('Assignment is not pending', 400);
  }

  const asset = await db('assets')
    .where({
      id: assignment.asset_id,
    })
    .first();

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  if (asset.status === 'retired' || asset.status === 'disposed') {
    throw new AppError('Asset is not available', 400);
  }

  await db.transaction(async (trx) => {
    // Update assignment
    await trx('assignments')
      .where({
        id,
      })
      .update({
        status: 'assigned',
        approved_at: new Date(),
        approved_by: req.user.id,
        assigned_since: new Date().toISOString().split('T')[0],
        updated_at: new Date(),
      });

    // Update asset
    await trx('assets')
      .where({
        id: assignment.asset_id,
      })
      .update({
        status: 'assigned',
        assigned_to: assignment.user_id,
        assigned_since: new Date().toISOString().split('T')[0],
        updated_at: new Date(),
      });
  });

  // Notify user
  await createNotification({
    userId: assignment.user_id,
    type: 'assignment_approved',
    title: 'Assignment Approved',
    message: `Your request for asset ${asset.asset_number} has been approved.`,
    entityType: 'assignment',
    entityId: id,
  });

  const updated = await getById(id);

  // Audit
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CHECKOUT_APPROVE',
      entity_type: 'assignment',
      entity_id: id,
      after_value: updated,
    });
  }

  return updated;
}

async function reject(id, rejectionReason, req) {
  const assignment = await db('assignments')
    .where({
      id,
    })
    .first();

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.status !== 'pending') {
    throw new AppError('Assignment is not pending', 400);
  }

  await db('assignments')
    .where({
      id,
    })
    .update({
      status: 'rejected',
      rejected_at: new Date(),
      approved_by: req.user.id,
      rejection_reason: rejectionReason || null,
      updated_at: new Date(),
    });

  // Notify user
  await createNotification({
    userId: assignment.user_id,
    type: 'assignment_rejected',
    title: 'Assignment Rejected',
    message: 'Your request for the asset has been rejected.',
    entityType: 'assignment',
    entityId: id,
  });

  const updated = await getById(id);

  // Audit
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CHECKOUT_REJECT',
      entity_type: 'assignment',
      entity_id: id,
      after_value: updated,
    });
  }

  return updated;
}

async function checkIn(id, returnData, req) {
  const assignment = await db('assignments')
    .where({
      id,
    })
    .first();

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (
    assignment.status !== 'assigned' &&
    assignment.status !== 'overdue'
  ) {
    throw new AppError('Assignment is not active', 400);
  }

  const asset = await db('assets')
    .where({
      id: assignment.asset_id,
    })
    .first();

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  await db.transaction(async (trx) => {
    // Update assignment
    await trx('assignments')
      .where({
        id,
      })
      .update({
        status: 'returned',
        returned_at: new Date(),
        return_notes: returnData.return_notes || null,
        return_condition: returnData.return_condition || 'good',
        updated_at: new Date(),
      });

    // Update asset
    await trx('assets')
      .where({
        id: assignment.asset_id,
      })
      .update({
        status: 'available',
        assigned_to: null,
        assigned_since: null,
        updated_at: new Date(),
      });
  });

  const updated = await getById(id);

  // Audit
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CHECKIN',
      entity_type: 'assignment',
      entity_id: id,
      after_value: updated,
      description: `Asset ${asset.asset_number || ''} returned`,
    });
  }

  return updated;
}

async function getOverdue() {
  const today = new Date().toISOString().split('T')[0];

  return db('assignments')
    .select(
      'assignments.*',
      'a.asset_number',
      'a.name as asset_name',
      'u.name as user_name',
      'u.employee_id as user_employee_id'
    )
    .leftJoin('assets as a', 'assignments.asset_id', 'a.id')
    .leftJoin('users as u', 'assignments.user_id', 'u.id')
    .where(function () {
      this.where('assignments.status', 'overdue')
        .orWhere(function () {
          this.where('assignments.status', 'assigned')
            .whereNotNull('assignments.expected_return')
            .where('assignments.expected_return', '<', today);
        });
    })
    .orderBy('assignments.expected_return', 'asc');
}

module.exports = {
  getAll,
  getById,
  create,
  approve,
  reject,
  checkIn,
  getOverdue,
};