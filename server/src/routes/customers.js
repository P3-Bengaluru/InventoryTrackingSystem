const express = require('express');
const { list, get, getAssets, create, update, deactivate } = require('../controllers/customerController');
const { validateBody, validateParams } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { create: createSchema, update: updateSchema } = require('../validators/customerValidator');
const { idParam } = require('../validators/common');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', validateParams(idParam), get);
router.get('/:id/assets', validateParams(idParam), getAssets);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateBody(createSchema), create);
router.put('/:id', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateParams(idParam), validateBody(updateSchema), update);
router.post('/:id/deactivate', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateParams(idParam), deactivate);

module.exports = router;
