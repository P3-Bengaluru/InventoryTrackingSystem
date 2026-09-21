const express = require('express');
const { assetRegister, checkoutHistory, activityLog, procurementReport } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/asset-register', assetRegister);
router.get('/checkout-history', checkoutHistory);
router.get('/activity-log', activityLog);
router.get('/procurement', procurementReport);

module.exports = router;
