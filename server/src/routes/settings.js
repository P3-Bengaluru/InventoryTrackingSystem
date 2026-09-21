const express = require('express');
const { list, publicList, get, update } = require('../controllers/settingsController');
const { validateBody, validateParams } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { update: updateSchema } = require('../validators/settingsValidator');

const router = express.Router();

router.get('/public', publicList);
router.use(authenticate);

router.get('/', list);
router.get('/:key', validateParams({ key: { type: 'string', required: true } }), get);
router.put('/:key', authorize('admin'), validateParams({ key: { type: 'string', required: true } }), validateBody(updateSchema), update);

module.exports = router;
