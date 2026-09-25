const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');
const { createNotification } = require('../utils/notifications');
const { isSelfApprovable, getMatchingTiers, buildApprovalRows } = require('../utils/approvalEngine');
const notify = require('../utils/procurementNotifications');

const TABLE = 'procurement_requests';
const APPROVALS = 'procurement_approvals';

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function badState(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function forbidden(message) {
  const err = new Error(message);
  err.status = 403;
  return err;
}

// ── Reads ────────────────────────────────────────────────────────────

// Engineers only ever see their own requests. Every other role sees
// the full list — narrow further with req.query if you need tighter
// per-role scoping later.
async function getAll(req) {
  const { role, id: userId } = req.user;
  const query = db(TABLE).select('*').orderBy('created_at', 'desc');

  if (role === 'engineer') {
    query.where({ requested_by: userId });
  }
  if (req.query.status) {
    query.where({ status: req.query.status });
  }

  return query;
}

async function getById(id) {
  const request = await db(TABLE).where({ id }).first();
  if (!request) throw notFound('Procurement request not found');

  const approvals = await db(APPROVALS).where({ procurement_id: id }).orderBy('level', 'asc');

  return { ...request, approvals };
}

// The approver inbox: every pending step currently sitting with me,
// regardless of which procurement request it belongs to.
async function getMyPendingApprovals(userId) {
  return db(APPROVALS)
    .join(TABLE, `${TABLE}.id`, `${APPROVALS}.procurement_id`)
    .where(`${APPROVALS}.approver_id`, userId)
    .andWhere(`${APPROVALS}.status`, 'pending')
    .select(
      `${APPROVALS}.id as approval_id`,
      `${APPROVALS}.level`,
      `${APPROVALS}.approver_role`,
      `${TABLE}.id as procurement_id`,
      `${TABLE}.item_name`,
      `${TABLE}.estimated_cost`,
      `${TABLE}.justification`,
      `${TABLE}.requested_by`
    )
    .orderBy(`${TABLE}.created_at`, 'asc');
}

async function getHistory(id) {
  return db('activity_logs')
    .where({ entity_type: 'procurement', entity_id: id })
    .orderBy('created_at', 'desc');
}

// ── Create: inventory match + tier lookup + approval chain ──────────

async function create(payload, requestedBy) {
  return db.transaction(async (trx) => {
    let matchedAssetId = null;
    let matchedNotes = null;

    // If they're asking for something that might already be in
    // inventory, look for an available match before assuming a new
    // purchase is needed.
    if (payload.request_type === 'existing_asset' && payload.category_id) {
      const candidate = await trx('assets')
        .where({ category_id: payload.category_id, status: 'available' })
        .first();

      if (candidate) {
        matchedAssetId = candidate.id;
        matchedNotes = `Found ${candidate.asset_number} (available) in inventory.`;
      } else {
        matchedNotes = 'No matching available asset found — will be treated as a new purchase if approved.';
      }
    }

    const requester = await trx('users').where({ id: requestedBy }).first();
    if (!requester) throw notFound('Requesting user not found');

    const [request] = await trx(TABLE)
      .insert({
        requested_by: requestedBy,
        department: payload.department ?? requester.department,
        project: payload.project,
        location_id: payload.location_id,
        request_type: payload.request_type,
        item_name: payload.item_name,
        category_id: payload.category_id,
        specifications: payload.specifications ? JSON.stringify(payload.specifications) : null,
        quantity: payload.quantity ?? 1,
        justification: payload.justification,
        estimated_cost: payload.estimated_cost,
        currency: payload.currency ?? 'INR',
        matched_asset_id: matchedAssetId,
        matched_notes: matchedNotes,
        status: 'submitted',
        priority: payload.priority ?? 'normal',
        submitted_at: trx.fn.now(),
      })
      .returning('*');

    // Below the requester's own self-approve limit — skip the
    // approval chain entirely.
    if (isSelfApprovable(requester.self_approve_limit, payload.estimated_cost)) {
      await trx(TABLE)
        .where({ id: request.id })
        .update({ status: 'self_approved', approved_at: trx.fn.now(), updated_at: trx.fn.now() });

      return getById(request.id);
    }

    // Otherwise, match against the budget tiers and build the
    // approval chain.
    const rules = await trx('approval_rules').where({ is_active: true });
    const tiers = getMatchingTiers(rules, payload.estimated_cost);

    if (tiers.length === 0) {
      // No configured tier covers this amount — leave it in
      // pending_approval for an admin to route manually.
      await trx(TABLE).where({ id: request.id }).update({ status: 'pending_approval', updated_at: trx.fn.now() });
      return getById(request.id);
    }

    // Simplest resolution: first active user holding that role.
    // Swap this out for a department/manager-chain lookup if your
    // org needs one approver per department rather than one globally.
    const approverResolver = async (role) => {
      const user = await trx('users').where({ role, is_active: true }).first();
      return user ? user.id : null;
    };

    const approvalRows = await buildApprovalRows(request.id, tiers, approverResolver);
    await trx(APPROVALS).insert(approvalRows);

    await trx(TABLE).where({ id: request.id }).update({ status: 'pending_approval', updated_at: trx.fn.now() });

    const firstLevel = approvalRows.reduce((min, row) => (row.level < min.level ? row : min));
    await notify.notifyNextApprover(firstLevel, request);

    return getById(request.id);
  });
}

// ── Approve / reject a single step in the chain ───────────────────────

async function decideApproval(procurementId, approvalId, approverId, decision, comments) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw badState('decision must be "approved" or "rejected"');
  }

  return db.transaction(async (trx) => {
    const approval = await trx(APPROVALS).where({ id: approvalId, procurement_id: procurementId }).first();
    if (!approval) throw notFound('Approval step not found');
    if (approval.approver_id !== approverId) {
      throw forbidden('You are not the assigned approver for this step');
    }
    if (approval.status !== 'pending') {
      throw badState('This approval step has already been actioned');
    }

    const request = await trx(TABLE).where({ id: procurementId }).first();
    if (!request) throw notFound('Procurement request not found');

    await trx(APPROVALS).where({ id: approvalId }).update({
      status: decision,
      comments,
      actioned_at: trx.fn.now(),
    });

    if (decision === 'rejected') {
      // A rejection at any level kills the whole request — mark any
      // still-pending levels as skipped rather than leaving them dangling.
      await trx(APPROVALS)
        .where({ procurement_id: procurementId, status: 'pending' })
        .update({ status: 'skipped' });

      await trx(TABLE).where({ id: procurementId }).update({
        status: 'rejected',
        rejection_reason: comments,
        updated_at: trx.fn.now(),
      });

      await notify.notifyRequesterOfDecision(request.requested_by, procurementId, request.item_name, 'rejected');
      return getById(procurementId);
    }

    // decision === 'approved' — activate the next level, if any.
    const nextPending = await trx(APPROVALS)
      .where({ procurement_id: procurementId, status: 'pending' })
      .orderBy('level', 'asc')
      .first();

    if (nextPending) {
      await notify.notifyNextApprover(nextPending, request);
      return getById(procurementId);
    }

    // No more levels pending — fully approved.
    await trx(TABLE).where({ id: procurementId }).update({
      status: 'approved',
      approved_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });

    await notify.notifyRequesterOfDecision(request.requested_by, procurementId, request.item_name, 'approved');
    await notify.notifyInventoryManagers(procurementId, request.item_name);

    return getById(procurementId);
  });
}

// ── Ordering + receiving ──────────────────────────────────────────────

async function markOrdered(id, { supplier_id, po_number, quoted_cost, expected_delivery }) {
  const request = await db(TABLE).where({ id }).first();
  if (!request) throw notFound('Procurement request not found');
  if (!['approved', 'self_approved'].includes(request.status)) {
    throw badState(`Cannot order a request in status "${request.status}"`);
  }

  await db(TABLE)
    .where({ id })
    .update({
      status: 'ordered',
      supplier_id,
      po_number,
      quoted_cost,
      expected_delivery,
      ordered_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  return getById(id);
}

async function markReceived(id) {
  return db.transaction(async (trx) => {
    const request = await trx(TABLE).where({ id }).first();
    if (!request) throw notFound('Procurement request not found');
    if (request.status !== 'ordered') {
      throw badState(`Cannot receive a request in status "${request.status}"`);
    }

    let createdAsset = null;

    // Existing-asset requests don't create a new asset on receipt —
    // that flow goes through `reallocations` instead (transferring the
    // already-matched asset to the requester), triggered separately
    // once approved.
    if (request.request_type === 'new_purchase') {
      [createdAsset] = await trx('assets')
        .insert({
          name: request.item_name,
          category_id: request.category_id,
          location_id: request.location_id,
          supplier_id: request.supplier_id,
          specifications: request.specifications,
          purchase_date: trx.fn.now(),
          purchase_price: request.quoted_cost ?? request.estimated_cost,
          invoice_number: request.po_number,
          status: 'available',
        })
        .returning('*');
    }

    await trx(TABLE)
      .where({ id })
      .update({
        status: 'received',
        actual_delivery: trx.fn.now(),
        asset_id_created: createdAsset ? createdAsset.id : null,
        received_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });

    if (createdAsset) {
      await notify.notifyRequesterOfReceipt(
        request.requested_by,
        id,
        request.item_name,
        createdAsset.asset_number
      );
    }

    return getById(id);
  });
}

async function cancel(id, requestedBy) {
  const request = await db(TABLE).where({ id }).first();
  if (!request) throw notFound('Procurement request not found');
  if (request.requested_by !== requestedBy) {
    throw forbidden('Only the original requester can cancel this request');
  }
  if (!['draft', 'submitted', 'pending_approval'].includes(request.status)) {
    throw badState(`Cannot cancel a request in status "${request.status}"`);
  }

  await db(APPROVALS).where({ procurement_id: id, status: 'pending' }).update({ status: 'skipped' });

  await db(TABLE).where({ id }).update({ status: 'cancelled', updated_at: db.fn.now() });

  return getById(id);
}

module.exports = {
  getAll,
  getById,
  getMyPendingApprovals,
  getHistory,
  create,
  decideApproval,
  markOrdered,
  markReceived,
  cancel,
};
