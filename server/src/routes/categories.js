const express = require('express');
const { tree, get, children, create, update, deactivate } = require('../controllers/categoryController');

const router = express.Router();

router.get('/tree', tree);
router.get('/:id', get);
router.get('/:id/children', children);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/deactivate', deactivate);

module.exports = router;
