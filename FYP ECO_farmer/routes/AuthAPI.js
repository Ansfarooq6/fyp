const express = require('express');
const authController = require('../controllers/authAPI')
const router = express.Router();

router.post('/api/login', authController.posttLogin);

module.exports = router