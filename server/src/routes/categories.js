const express = require('express');
const { tree, get, children, create, update, deactivate } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/tree', tree);
router.get('/:id', get);
router.get('/:id/children', children);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), create);
router.put('/:id', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), update);
router.post('/:id/deactivate', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), deactivate);

module.exports = router;
