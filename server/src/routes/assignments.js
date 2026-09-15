const express = require('express');
const { list, get, create, approve, reject, checkIn } = require('../controllers/assignmentController');

const router = express.Router();

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.post('/:id/approve', approve);
router.post('/:id/reject', reject);
router.post('/:id/check-in', checkIn);

module.exports = router;
