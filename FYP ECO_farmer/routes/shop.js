const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');

const auth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getfruits);

router.get('/products/:productId' ,auth, shopController.getProduct);

router.get('/vegetable' ,  shopController.getVegetables);

//router.get('/farmer',shopController.Farmer);

router.get('/cart', auth ,shopController.getCart);

router.get('/checkout', auth ,shopController.getCheckout);
router.get('/success/checkout', auth ,shopController.getCheckOutsucssess);
router.get('/success/cancel' ,auth ,shopController.getCheckout);

router.post('/cart',auth , shopController.postCart);

router.post('/cart-delete-item', auth ,shopController.postCartDeleteProduct);

//router.post('/create-order', auth ,shopController.postOrder);

router.get('/orders',auth , shopController.getOrders);

router.get('/order/:orderId',auth , shopController.getInvoice)

router.get('/farmer/:farmerName', shopController.farmer);

router.get('/tours',shopController.getTours);

router.get('/course',shopController.getCourses);

router.get('/confirm-tour/:tourId', shopController.getConfirmTour);


router.post('/confirm-tour/:tourId',shopController.postBooking);

router.get('/course-info/:courseId', shopController.getCourseCart);

router.get('/enroll-course/:coruseId', shopController.enrollCourse);

router.get('/enroll-success', shopController.postEnrollSuccess);

router.get('/orders/enrollment',shopController.getUserEnrollments);

router.get('/orders/bookings',shopController.getUserFarmTourBookings);

module.exports = router;
