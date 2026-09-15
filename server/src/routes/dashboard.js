const express = require('express');
const { stats, trend, recent } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', stats);
router.get('/trend', trend);
router.get('/recent', recent);

module.exports = router;
