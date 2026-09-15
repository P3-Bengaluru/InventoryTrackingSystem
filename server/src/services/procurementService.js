const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');
const { createNotification } = require('../utils/notifications');
const assetService = require('./assetService');

async function searchInventory({ item_name, category_id, specifications }) {
  const results = { available: [], assigned: [], other: [], has_match: false };

  let query = db('assets')
    .select(
      'assets.id',
      'assets.asset_number',
      'assets.name',
      'assets.status',
      'assets.brand',
      'assets.model',
      'assets.serial_number',
      'assets.specifications',
      'categories.name as category_name',
      'u.name as assigned_to_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('users as u', 'assets.assigned_to', 'u.id')
    .where('assets.is_active', true);

  if (item_name) {
    query.andWhere(function () {
      this.whereILike('assets.name', `%${item_name}%`)
        .orWhereILike('assets.brand', `%${item_name}%`)
        .orWhereILike('assets.model', `%${item_name}%`);
    });
  }
  if (category_id) query.andWhere({ 'assets.category_id': category_id });

  const assets = await query.limit(50);

  for (const asset of assets) {
    let specsMatch = true;
    if (specifications && typeof specifications === 'object') {
      try {
        const assetSpecs = typeof asset.specifications === 'string' ? JSON.parse(asset.specifications) : asset.specifications;
        if (assetSpecs) {
          for (const [key, val] of Object.entries(specifications)) {
            if (assetSpecs[key] && String(assetSpecs[key]).toLowerCase() !== String(val).toLowerCase()) {
              specsMatch = false;
              break;
            }
          }
        }
      } catch {
        specsMatch = true;
      }
    }
    if (!specsMatch) continue;

    if (asset.status === 'available') {
      results.available.push({
        id: asset.id,
        asset_number: asset.asset_number,
        name: asset.name,
        brand: asset.brand,
        model: asset.model,
        status: asset.status,
        category_name: asset.category_name,
      });
    } else if (asset.status === 'assigned') {
      results.assigned.push({
        id: asset.id,
        asset_number: asset.asset_number,
        name: asset.name,
        brand: asset.brand,
        model: asset.model,
        status: asset.status,
        category_name: asset.category_name,
        assignee_first_name: asset.assigned_to_name ? asset.assigned_to_name.split(' ')[0] : null,
      });
    } else {
      results.other.push({
        id: asset.id,
        asset_number: asset.asset_number,
        name: asset.name,
        status: asset.status,
        category_name: asset.category_name,
      });
    }
  }

  results.has_match = results.available.length > 0 || results.assigned.length > 0 || results.other.length > 0;
  return results;
}

async function getAll(filters = {}, user) {
  const query = db('procurement_requests')
    .select(
      'procurement_requests.*',
      'u.name as requested_by_name',
      'u.employee_id as requested_by_emp_id',
      'c.name as category_name',
      'l.name as location_name',
      's.name as supplier_name',
      'a.asset_number as created_asset_number'
    )
    .leftJoin('users as u', 'procurement_requests.requested_by', 'u.id')
    .leftJoin('categories as c', 'procurement_requests.category_id', 'c.id')
    .leftJoin('locations as l', 'procurement_requests.location_id', 'l.id')
    .leftJoin('suppliers as s', 'procurement_requests.supplier_id', 's.id')
    .leftJoin('assets as a', 'procurement_requests.asset_id_created', 'a.id');

  if (user.role === 'engineer') {
    query.andWhere({ 'procurement_requests.requested_by': user.id });
  }

  if (filters.status) query.andWhere({ 'procurement_requests.status': filters.status });
  if (filters.priority) query.andWhere({ 'procurement_requests.priority': filters.priority });

  query.orderBy('procurement_requests.created_at', 'desc');
  return query;
}

async function getById(id) {
  const pr = await db('procurement_requests')
    .select(
      'procurement_requests.*',
      'u.name as requested_by_name',
      'u.employee_id as requested_by_emp_id',
      'c.name as category_name',
      'l.name as location_name',
      's.name as supplier_name',
      'a.asset_number as created_asset_number'
    )
    .leftJoin('users as u', 'procurement_requests.requested_by', 'u.id')
    .leftJoin('categories as c', 'procurement_requests.category_id', 'c.id')
    .leftJoin('locations as l', 'procurement_requests.location_id', 'l.id')
    .leftJoin('suppliers as s', 'procurement_requests.supplier_id', 's.id')
    .leftJoin('assets as a', 'procurement_requests.asset_id_created', 'a.id')
    .where({ 'procurement_requests.id': id })
    .first();
  if (!pr) throw new AppError('Procurement request not found', 404);

  const approvals = await db('procurement_approvals')
    .select(
      'procurement_approvals.*',
      'u.name as approver_name'
    )
    .leftJoin('users as u', 'procurement_approvals.approver_id', 'u.id')
    .where({ procurement_id: id })
    .orderBy('level', 'asc');

  pr.approvals = approvals;
  return pr;
}

async function create(data, req) {
  const [pr] = await db('procurement_requests')
    .insert({
      requested_by: req.user.id,
      department: data.department || null,
      project: data.project || null,
      location_id: data.location_id || null,
      request_type: data.request_type || 'new_purchase',
      item_name: data.item_name,
      category_id: data.category_id || null,
      specifications: data.specifications ? JSON.stringify(data.specifications) : null,
      quantity: data.quantity || 1,
      justification: data.justification,
      estimated_cost: data.estimated_cost || null,
      quoted_cost: data.quoted_cost || null,
      currency: data.currency || 'INR',
      status: 'draft',
      priority: data.priority || 'normal',
      notes: data.notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');

  const created = await getById(pr.id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'PROCUREMENT_RAISED',
      entity_type: 'procurement',
      entity_id: pr.id,
      after_value: created,
    });
  }
  return created;
}

async function submit(id, req) {
  const pr = await db('procurement_requests').where({ id }).first();
  if (!pr) throw new AppError('Procurement request not found', 404);
  if (pr.status !== 'draft') throw new AppError('Request is not in draft status', 400);

  const user = await db('users').where({ id: pr.requested_by }).first();
  const cost = parseFloat(pr.estimated_cost) || 0;

  if (user.role === 'engineer' && cost > 0 && cost <= parseFloat(user.self_approve_limit || 0)) {
    await db('procurement_requests').where({ id }).update({
      status: 'self_approved',
      submitted_at: new Date(),
      updated_at: new Date(),
    });
    const updated = await getById(id);
    if (req) {
      await auditFromReq(req, {
        log_type: 'audit',
        action: 'PROCUREMENT_APPROVED',
        entity_type: 'procurement',
        entity_id: id,
        description: 'Self-approved',
      });
    }
    return updated;
  }

  const rules = await db('approval_rules')
    .where({ is_active: true })
    .where(function () {
      this.whereNull('max_amount').orWhere('max_amount', '>=', cost);
    })
    .where('min_amount', '<=', cost)
    .orderBy('approver_level', 'asc');

  if (rules.length === 0) {
    await db('procurement_requests').where({ id }).update({
      status: 'approved',
      submitted_at: new Date(),
      updated_at: new Date(),
    });
    const updated = await getById(id);
    if (req) {
      await auditFromReq(req, {
        log_type: 'audit',
        action: 'PROCUREMENT_APPROVED',
        entity_type: 'procurement',
        entity_id: id,
        description: 'No approval rules matched, auto-approved',
      });
    }
    return updated;
  }

  const approvalRows = [];
  for (const rule of rules) {
    let approverId = null;
    if (rule.approver_role === 'manager' && user.manager_id) {
      approverId = user.manager_id;
    }
    approvalRows.push({
      procurement_id: id,
      approver_id: approverId,
      approver_role: rule.approver_role,
      level: rule.approver_level,
      status: 'pending',
      created_at: new Date(),
    });

    if (approverId) {
      await createNotification({
        userId: approverId,
        type: 'procurement_submitted',
        title: 'Procurement Approval Needed',
        message: `Procurement request for "${pr.item_name}" needs your approval.`,
        entityType: 'procurement',
        entityId: id,
      });
    } else {
      const approvers = await db('users').where({ role: rule.approver_role, is_active: true }).select('id');
      for (const a of approvers) {
        await createNotification({
          userId: a.id,
          type: 'procurement_submitted',
          title: 'Procurement Approval Needed',
          message: `Procurement request for "${pr.item_name}" needs approval.`,
          entityType: 'procurement',
          entityId: id,
        });
      }
    }
  }

  await db('procurement_approvals').insert(approvalRows);
  await db('procurement_requests').where({ id }).update({
    status: 'pending_approval',
    submitted_at: new Date(),
    updated_at: new Date(),
  });

  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'PROCUREMENT_RAISED',
      entity_type: 'procurement',
      entity_id: id,
      description: 'Submitted for approval',
    });
  }
  return updated;
}

async function action(id, { action: actionType, comments, rejection_reason }, req) {
  const pr = await db('procurement_requests').where({ id }).first();
  if (!pr) throw new AppError('Procurement request not found', 404);
  if (pr.status !== 'pending_approval') throw new AppError('Request is not pending approval', 400);

  const approvals = await db('procurement_approvals')
    .where({ procurement_id: id })
    .orderBy('level', 'asc');

  const currentApproval = approvals.find((a) => a.status === 'pending');
  if (!currentApproval) throw new AppError('No pending approval found', 400);

  const canApprove =
    req.user.role === 'admin' ||
    req.user.role === currentApproval.approver_role ||
    currentApproval.approver_id === req.user.id;

  if (!canApprove) throw new AppError('You are not the designated approver for this level', 403);

  if (actionType === 'approve') {
    await db('procurement_approvals').where({ id: currentApproval.id }).update({
      status: 'approved',
      comments: comments || null,
      actioned_at: new Date(),
    });

    const remaining = approvals.filter((a) => a.status === 'pending' && a.id !== currentApproval.id);
    if (remaining.length === 0) {
      await db('procurement_requests').where({ id }).update({
        status: 'approved',
        approved_at: new Date(),
        updated_at: new Date(),
      });
      await createNotification({
        userId: pr.requested_by,
        type: 'procurement_approved',
        title: 'Procurement Approved',
        message: `Your request for "${pr.item_name}" has been fully approved.`,
        entityType: 'procurement',
        entityId: id,
      });
    }

    const updated = await getById(id);
    if (req) {
      await auditFromReq(req, {
        log_type: 'audit',
        action: 'PROCUREMENT_APPROVED',
        entity_type: 'procurement',
        entity_id: id,
        after_value: updated,
      });
    }
    return updated;
  } else if (actionType === 'reject') {
    await db('procurement_approvals').where({ id: currentApproval.id }).update({
      status: 'rejected',
      comments: comments || null,
      actioned_at: new Date(),
    });

    await db('procurement_requests').where({ id }).update({
      status: 'rejected',
      rejection_reason: rejection_reason || comments || null,
      updated_at: new Date(),
    });

    await createNotification({
      userId: pr.requested_by,
      type: 'procurement_rejected',
      title: 'Procurement Rejected',
      message: `Your request for "${pr.item_name}" has been rejected.`,
      entityType: 'procurement',
      entityId: id,
    });

    const updated = await getById(id);
    if (req) {
      await auditFromReq(req, {
        log_type: 'audit',
        action: 'PROCUREMENT_REJECTED',
        entity_type: 'procurement',
        entity_id: id,
        after_value: updated,
      });
    }
    return updated;
  }
  throw new AppError('Invalid action', 400);
}

async function markOrdered(id, data, req) {
  const pr = await db('procurement_requests').where({ id }).first();
  if (!pr) throw new AppError('Procurement request not found', 404);
  if (pr.status !== 'approved' && pr.status !== 'self_approved') throw new AppError('Request must be approved first', 400);

  await db('procurement_requests').where({ id }).update({
    status: 'ordered',
    po_number: data.po_number || null,
    expected_delivery: data.expected_delivery || null,
    quoted_cost: data.quoted_cost || pr.quoted_cost,
    supplier_id: data.supplier_id || pr.supplier_id,
    supplier_quote_url: data.supplier_quote_url || null,
    ordered_at: new Date(),
    updated_at: new Date(),
  });

  await createNotification({
    userId: pr.requested_by,
    type: 'procurement_ordered',
    title: 'Procurement Ordered',
    message: `Your request for "${pr.item_name}" has been ordered.`,
    entityType: 'procurement',
    entityId: id,
  });

  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'PROCUREMENT_ORDERED',
      entity_type: 'procurement',
      entity_id: id,
      after_value: updated,
    });
  }
  return updated;
}

async function markReceived(id, data, req) {
  const pr = await db('procurement_requests').where({ id }).first();
  if (!pr) throw new AppError('Procurement request not found', 404);
  if (pr.status !== 'ordered') throw new AppError('Request must be ordered first', 400);

  let assetIdCreated = data.asset_id_created || null;

  if (!assetIdCreated && pr.category_id) {
    const assetData = {
      name: pr.item_name,
      category_id: pr.category_id,
      specifications: pr.specifications ? (typeof pr.specifications === 'string' ? JSON.parse(pr.specifications) : pr.specifications) : null,
      supplier_id: pr.supplier_id || null,
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: pr.quoted_cost || pr.estimated_cost || null,
      invoice_number: pr.po_number || null,
      status: 'available',
      notes: `Created from procurement request ${pr.id}`,
    };
    const created = await assetService.create(assetData, req);
    assetIdCreated = created.id;
  }

  await db('procurement_requests').where({ id }).update({
    status: 'received',
    actual_delivery: data.actual_delivery || new Date().toISOString().split('T')[0],
    asset_id_created: assetIdCreated,
    received_at: new Date(),
    updated_at: new Date(),
  });

  await createNotification({
    userId: pr.requested_by,
    type: 'procurement_received',
    title: 'Procurement Received',
    message: `Your request for "${pr.item_name}" has been received.`,
    entityType: 'procurement',
    entityId: id,
  });

  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'PROCUREMENT_RECEIVED',
      entity_type: 'procurement',
      entity_id: id,
      after_value: updated,
    });
  }
  return updated;
}

module.exports = {
  searchInventory,
  getAll,
  getById,
  create,
  submit,
  action,
  markOrdered,
  markReceived,
};
