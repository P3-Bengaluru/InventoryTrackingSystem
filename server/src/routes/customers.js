const express = require('express');
const { list, get, getAssets, create, update, deactivate } = require('../controllers/customerController');
const { validateBody, validateParams } = require('../middleware/validate');
const { create: createSchema, update: updateSchema } = require('../validators/customerValidator');
const { idParam } = require('../validators/common');

const router = express.Router();

router.get('/', list);
router.get('/:id', validateParams(idParam), get);
router.get('/:id/assets', validateParams(idParam), getAssets);
router.post('/', validateBody(createSchema), create);
router.put('/:id', validateParams(idParam), validateBody(updateSchema), update);
router.post('/:id/deactivate', validateParams(idParam), deactivate);

module.exports = router;
