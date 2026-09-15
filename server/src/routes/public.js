const express = require('express');
const { index } = require('../controllers/publicController');

const router = express.Router();

router.get('/', index);

module.exports = router;
