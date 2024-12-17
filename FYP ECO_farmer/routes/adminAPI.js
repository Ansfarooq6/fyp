const express = require('express');
const router = express.Router();
const isAuth = require('../middleAPI/auth');
const adminAPIcontroller = require('../controllers/adminAPI');

router.get('/api/admin/products', isAuth,adminAPIcontroller.adminproducts); 



module.exports = router;