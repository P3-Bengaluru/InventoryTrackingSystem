const express = require('express');
const { list, forEntity, createMaintenance } = require('../controllers/activityLogController');

const router = express.Router();

router.get('/', list);
router.get('/entity/:entityType/:entityId', forEntity);
router.post('/maintenance', createMaintenance);

module.exports = router;
