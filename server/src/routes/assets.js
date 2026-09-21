const express = require('express');
const {
  list,
  stats,
  mine,
  get,
  create,
  update,
  updateStatus,
  retire,
  remove,
  history,
  rotateQr,
} = require('../controllers/assetController');
const { authenticate, authorize, inventoryAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.get('/stats', stats);
router.get('/mine', mine);
router.get('/:id', get);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), create);
router.put('/:id', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), update);
router.patch('/:id/status', inventoryAccess, authorize('admin', 'inventory_manager', 'manager', 'project_manager'), updateStatus);
router.post('/:id/retire', inventoryAccess, authorize('admin', 'inventory_manager', 'manager', 'project_manager'), retire);
router.delete('/:id', inventoryAccess, authorize('admin', 'inventory_manager'), remove);
router.get('/:id/history', history);
router.post('/:id/rotate-qr', inventoryAccess, authorize('admin', 'inventory_manager', 'manager', 'project_manager'), rotateQr);

module.exports = router;
