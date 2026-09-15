const express = require('express');
const { login, refresh, logout, me } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
