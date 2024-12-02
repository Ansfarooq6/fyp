const path = require('path');

const {check,body} = require('express-validator');
const User = require('../models/user');


const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/check-role')

const router = express.Router();

router.use(isAuth);
 
router.use(isAdmin);


// /admin/add-product => GET
router.get('/add-product',isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',[
    body('title')
    .isString()
    .isLength({ min : 5})
    .trim(),
    body('price')
    .isFloat(),
    body('description')
    .isString()
    .isLength({min :  5 ,max : 400})
    .trim()
],adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth,adminController.getEditProduct);

router.post('/edit-product',[
    body('title')
    .isString()
    .isLength( {min : 5})
    .trim(),
    body('pricr')
    .isFloat(),
    body('discription')
    .isString()
    .isLength( { min : 5})
    .trim(),
], isAuth,adminController.postEditProduct);

//router.delete('/product/:productId', isAuth,adminController.postDeleteProduct);

router.post('/product/:productId', isAuth,adminController.postDeleteProduct);

router.get('/Course' , isAuth , adminController.getCoruse);

router.post('/add-course', isAuth, [
    body('courseName').trim().not().isEmpty(),
    body('availableSlots').isNumeric(),
    body('availableDays').trim().not().isEmpty(),
    body('mode').trim().not().isEmpty(),
    body('courseDuration').trim().not().isEmpty(),
    body('courseFee').isNumeric()
  ], adminController.postAddCourse);

router.get('/addtours',adminController.getTour);

router.post('/addtours',adminController.postAddFarmTour);

router.get('/orders', adminController.getFarmerOrders)

router.get('/managebooking',adminController.getFarmerBookings);

router.get('/Tour',adminController.getAdminTours);

router.get('/edit-tour/:tourId', adminController.getEditTour);

router.post('/edit-tour/:tourId',adminController.postEditTour),

router.post('/delete-tour',adminController.postDeleteTour)

router.get('/manageenrollments', adminController.getAllEnrollments);

module.exports = router;
