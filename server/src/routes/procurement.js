const express = require('express');
const {
	search,
	list,
	get,
	create,
	submit,
	action,
	markOrdered,
	markReceived,
} = require('../controllers/procurementController');

const router = express.Router();

router.post('/search', search);
router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.post('/:id/submit', submit);
router.post('/:id/action', action);
router.post('/:id/mark-ordered', markOrdered);
router.post('/:id/mark-received', markReceived);

module.exports = router;
