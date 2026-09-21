const express = require('express');
const { list, get, create, approve, reject } = require('../controllers/reallocationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', get);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), create);
router.post('/:id/approve', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), approve);
router.post('/:id/reject', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), reject);

module.exports = router;
