const express = require('express');
const { list, markRead, markAllRead, unreadCount } = require('../controllers/notificationController');
const { validateParams } = require('../middleware/validate');
const { idParam } = require('../validators/common');

const router = express.Router();

router.get('/', list);
router.post('/:id/read', validateParams(idParam), markRead);
router.post('/read-all', markAllRead);
router.get('/unread-count', unreadCount);

module.exports = router;
