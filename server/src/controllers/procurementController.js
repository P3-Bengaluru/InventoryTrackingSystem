const procurementService  = require('../services/procurementService');
const { auditFromReq }    = require('../utils/audit');
const { asyncHandler }    = require('../middleware/errorHandler');

// GET /api/procurement
const list = asyncHandler(async (req, res) => {
  const result = await procurementService.getAll(req);
  res.json(result);
});

// GET /api/procurement/pending-approvals
const myPendingApprovals = asyncHandler(async (req, res) => {
  const result = await procurementService.getMyPendingApprovals(req.user.id);
  res.json(result);
});

// GET /api/procurement/:id
const get = asyncHandler(async (req, res) => {
  const request = await procurementService.getById(req.params.id);
  res.json(request);
});

// GET /api/procurement/:id/history
const history = asyncHandler(async (req, res) => {
  const data = await procurementService.getHistory(req.params.id);
  res.json(data);
});

// POST /api/procurement
const create = asyncHandler(async (req, res) => {
  const request = await procurementService.create(req.body, req.user.id);

  await auditFromReq(req, 'PROCUREMENT_RAISED', 'procurement', request.id, null, request);

  res.status(201).json(request);
});

// PATCH /api/procurement/:id/approvals/:approvalId
// body: { decision: 'approved' | 'rejected', comments?: string }
const decideApproval = asyncHandler(async (req, res) => {
  const { decision, comments } = req.body;
  const before = await procurementService.getById(req.params.id);

  const request = await procurementService.decideApproval(
    req.params.id,
    req.params.approvalId,
    req.user.id,
    decision,
    comments
  );

  const action = decision === 'approved' ? 'PROCUREMENT_APPROVED' : 'PROCUREMENT_REJECTED';
  await auditFromReq(req, action, 'procurement', request.id, before, request);

  res.json(request);
});

// PATCH /api/procurement/:id/order
// body: { supplier_id, po_number, quoted_cost, expected_delivery }
const markOrdered = asyncHandler(async (req, res) => {
  const before  = await procurementService.getById(req.params.id);
  const request = await procurementService.markOrdered(req.params.id, req.body);

  await auditFromReq(req, 'PROCUREMENT_ORDERED', 'procurement', request.id, before, request);

  res.json(request);
});

// PATCH /api/procurement/:id/receive
const markReceived = asyncHandler(async (req, res) => {
  const before  = await procurementService.getById(req.params.id);
  const request = await procurementService.markReceived(req.params.id);

  await auditFromReq(req, 'PROCUREMENT_RECEIVED', 'procurement', request.id, before, request);

  res.json(request);
});

// PATCH /api/procurement/:id/cancel
const cancel = asyncHandler(async (req, res) => {
  const before  = await procurementService.getById(req.params.id);
  const request = await procurementService.cancel(req.params.id, req.user.id);

  await auditFromReq(req, 'UPDATE', 'procurement', request.id, before, request);

  res.json(request);
});

module.exports = {
  list,
  myPendingApprovals,
  get,
  history,
  create,
  decideApproval,
  markOrdered,
  markReceived,
  cancel,
};
