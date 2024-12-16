const express = require('express');
const authController = require('../controllers/authAPI')
const router = express.Router();

router.get('/api/login', authController.gettlogin);

module.exports = router