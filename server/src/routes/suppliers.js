const express = require('express');
const { list, get, create, update, deactivate } = require('../controllers/supplierController');
const { validateBody, validateParams } = require('../middleware/validate');
const { create: createSchema, update: updateSchema } = require('../validators/supplierValidator');
const { idParam } = require('../validators/common');

const router = express.Router();

router.get('/', list);
router.get('/:id', validateParams(idParam), get);
router.post('/', validateBody(createSchema), create);
router.put('/:id', validateParams(idParam), validateBody(updateSchema), update);
router.post('/:id/deactivate', validateParams(idParam), deactivate);

module.exports = router;
