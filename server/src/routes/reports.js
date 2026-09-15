const express = require('express');
const { assetRegister, checkoutHistory, activityLog, procurementReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/asset-register', assetRegister);
router.get('/checkout-history', checkoutHistory);
router.get('/activity-log', activityLog);
router.get('/procurement', procurementReport);

module.exports = router;
