const express = require('express');
const { stats, trend, recent } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', stats);
router.get('/trend', trend);
router.get('/recent', recent);

module.exports = router;
