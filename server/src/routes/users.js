const express = require('express');
const {
  list,
  get,
  create,
  update,
  changeMyPassword,
  adminResetPassword,
  toggleActive,
  assignedAssets,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'inventory_manager', 'project_manager', 'manager', 'auditor'), list);
router.get('/:id', authorize('admin', 'inventory_manager', 'project_manager', 'manager', 'auditor'), get);
router.post('/', authorize('admin'), create);
router.put('/:id', authorize('admin', 'inventory_manager', 'project_manager', 'manager'), update);
router.post('/:id/reset-password', authorize('admin'), adminResetPassword);
router.post('/:id/toggle-active', authorize('admin'), toggleActive);
router.post('/me/change-password', changeMyPassword);
router.get('/:id/assigned-assets', authorize('admin', 'inventory_manager', 'project_manager', 'manager', 'auditor'), assignedAssets);

module.exports = router;
