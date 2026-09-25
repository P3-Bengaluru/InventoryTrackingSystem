/**
 * Thin wrapper around the `notifications` table for procurement events.
 * Keeps the notification "shape" (type, title, message, entity_type/id)
 * consistent in one place instead of scattered across the service.
 */
const db = require('../models/db'); // adjust to wherever your Knex instance is exported from

const TYPES = {
  SUBMITTED: 'procurement_submitted',
  APPROVED: 'procurement_approved',
  REJECTED: 'procurement_rejected',
  ORDERED: 'procurement_ordered',
  RECEIVED: 'procurement_received',
};

function notify(userId, type, title, message, procurementId) {
  return db('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    entity_type: 'procurement',
    entity_id: procurementId,
  });
}

// Fires when a new approval level activates — either right after
// submission or right after the previous level signs off.
async function notifyNextApprover(approvalRow, requestSummary) {
  await notify(
    approvalRow.approver_id,
    TYPES.SUBMITTED,
    'Procurement request awaiting your approval',
    `${requestSummary.item_name} (₹${requestSummary.estimated_cost}) needs your sign-off at level ${approvalRow.level}.`,
    requestSummary.id
  );
}

async function notifyRequesterOfDecision(requesterId, procurementId, itemName, decision) {
  const type = decision === 'approved' ? TYPES.APPROVED : TYPES.REJECTED;
  const title = decision === 'approved' ? 'Procurement request approved' : 'Procurement request rejected';
  await notify(requesterId, type, title, `Your request for "${itemName}" was ${decision}.`, procurementId);
}

async function notifyInventoryManagers(procurementId, itemName) {
  const managers = await db('users').where({ role: 'inventory_manager', is_active: true }).select('id');

  await Promise.all(
    managers.map((manager) =>
      notify(
        manager.id,
        TYPES.APPROVED,
        'Approved request ready to order',
        `"${itemName}" has full approval and is ready for a purchase order.`,
        procurementId
      )
    )
  );
}

async function notifyRequesterOfReceipt(requesterId, procurementId, itemName, assetNumber) {
  await notify(
    requesterId,
    TYPES.RECEIVED,
    'Procurement item received',
    `"${itemName}" has arrived and was added to inventory as ${assetNumber}.`,
    procurementId
  );
}

module.exports = {
  TYPES,
  notify,
  notifyNextApprover,
  notifyRequesterOfDecision,
  notifyInventoryManagers,
  notifyRequesterOfReceipt,
};
