const express = require('express');
const { tree, byLevel, get, children, create, update, deactivate } = require('../controllers/locationController');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { create: createSchema, update: updateSchema } = require('../validators/locationValidator');
const { idParam } = require('../validators/common');

const router = express.Router();

router.use(authenticate);

router.get('/tree', tree);
router.get('/level/:level', validateQuery, byLevel);
router.get('/:id', validateParams(idParam), get);
router.get('/:id/children', validateParams(idParam), children);
router.post('/', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateBody(createSchema), create);
router.put('/:id', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateParams(idParam), validateBody(updateSchema), update);
router.post('/:id/deactivate', authorize('admin', 'inventory_manager', 'manager', 'project_manager'), validateParams(idParam), deactivate);

module.exports = router;
