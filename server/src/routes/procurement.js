const express = require('express');
const {
	search,
	list,
	get,
	create,
	submit,
	action,
	markOrdered,
	markReceived,
} = require('../controllers/procurementController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/search', search);
router.get('/', list);
router.get('/:id', get);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), create);
router.post('/:id/submit', authorize('admin', 'inventory_manager', 'manager', 'project_manager', 'engineer'), submit);
router.post('/:id/action', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), action);
router.post('/:id/mark-ordered', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), markOrdered);
router.post('/:id/mark-received', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), markReceived);

module.exports = router;
