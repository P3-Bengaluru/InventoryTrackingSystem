const express = require('express');
const { list, get, create, approve, reject } = require('../controllers/reallocationController');

const router = express.Router();

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.post('/:id/approve', approve);
router.post('/:id/reject', reject);

module.exports = router;
