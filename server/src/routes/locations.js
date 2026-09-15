const express = require('express');
const { tree, byLevel, get, children, create, update, deactivate } = require('../controllers/locationController');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const { create: createSchema, update: updateSchema } = require('../validators/locationValidator');
const { idParam } = require('../validators/common');

const router = express.Router();

router.get('/tree', tree);
router.get('/level/:level', validateQuery, byLevel);
router.get('/:id', validateParams(idParam), get);
router.get('/:id/children', validateParams(idParam), children);
router.post('/', validateBody(createSchema), create);
router.put('/:id', validateParams(idParam), validateBody(updateSchema), update);
router.post('/:id/deactivate', validateParams(idParam), deactivate);

module.exports = router;
