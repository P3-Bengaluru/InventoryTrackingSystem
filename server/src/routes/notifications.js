const express = require('express');
const { list, markRead, markAllRead, unreadCount } = require('../controllers/notificationController');
const { validateParams } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { idParam } = require('../validators/common');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.post('/:id/read', validateParams(idParam), markRead);
router.post('/read-all', markAllRead);
router.get('/unread-count', unreadCount);

module.exports = router;
