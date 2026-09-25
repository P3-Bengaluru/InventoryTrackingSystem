const express = require('express');
const router = express.Router();

const procurementController = require('../controllers/procurementController');
// Adjust these two imports to match your actual auth middleware names/paths.
const { authenticate, authorize } = require('../middleware/auth');

// Any authenticated user can raise a request and see their own list.
router.post('/', authenticate, procurementController.create);
router.get('/', authenticate, procurementController.list);
router.get('/pending-approvals', authenticate, procurementController.myPendingApprovals);
router.get('/:id', authenticate, procurementController.get);
router.get('/:id/history', authenticate, procurementController.history);

// Only the specific assigned approver can actually action a step —
// that check happens in the service layer (approval.approver_id must
// match the caller). authorize() here just keeps engineers off this
// route entirely; it isn't the source of truth for "whose turn it is".
router.patch(
  '/:id/approvals/:approvalId',
  authenticate,
  authorize('manager', 'inventory_manager', 'project_manager', 'admin'),
  procurementController.decideApproval
);

router.patch(
  '/:id/order',
  authenticate,
  authorize('inventory_manager', 'admin'),
  procurementController.markOrdered
);

router.patch(
  '/:id/receive',
  authenticate,
  authorize('inventory_manager', 'admin'),
  procurementController.markReceived
);

// Requester-only; enforced in the service layer.
router.patch('/:id/cancel', authenticate, procurementController.cancel);

module.exports = router;
