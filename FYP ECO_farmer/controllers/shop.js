const Product = require('../models/product');
const Farmer = require('../models/farmer');
const Order = require('../models/order');
const FarmTour = require('../models/tours');
const Course = require('../models/course');
const Booking = require('../models/booking');
const Enroll = require('../models/enrollment');
const mongoose =require('mongoose')
const fs = require('fs');
const PDFDoc = require('pdfkit');
const path = require('path');
const stripe = require('stripe')('sk_test_51PICjRG6Qc0pxCXDaPi8JJRJxZqjzoW5GG4S3is6fujL5jyBda2t6oCddDCcHKMAA8SOzkeGlacFoDPR1czb9hse00DouopulN');

exports.getfruits = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const item_per_page = 4;
  let totalItems;

  Product.find({category : 'fruit'})
    .countDocuments()
    .then(numProduct => {
      totalItems = numProduct;
      return Product.find({category:'fruit'})
        .populate('userId', 'username') // Ensure that 'userId' is populated with 'username'
        .skip((page - 1) * item_per_page)
        .limit(item_per_page);
    })
    .then(products => {
      // console.log('Fetched products:', products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: item_per_page * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / item_per_page),
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch(err => console.log(err));
};

  

exports.getIndex= (req ,res ,next) =>{
  const page = parseInt(req.query.page, 10) || 1;
  const item_per_page = 12;
  let totalItems ;
 
  Product.find()
  .countDocuments()
  .then(numProduct => {
    totalItems = numProduct;
    return Product.find()
      .populate('userId', 'username') 
      .skip((page - 1) * item_per_page)
      .limit(item_per_page);
  })
  .then( product =>{
    //console.log(product);
    res.render('shop/index', {
      prods: product,
      pageTitle: 'Shop',
      path: '/',
      isAuthenticated: req.session.isLoggedIn,
      totalProducts: totalItems,
      currentPage: page,
      hasNextPage: item_per_page * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / item_per_page)
      });
  }).catch(err =>{
    const error = new Error(err);
    error.httpStatusCode(500);
    return next(error);
  })
}



exports.getVegetables = async (req, res, next) => {
  const ITEMS_PER_PAGE = 10;
  const page = +req.query.page || 1;
  try {
    const totalItems = await Product.countDocuments({ category: 'vegetable' });
    const vegetables = await Product.find({ category: 'vegetable' })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/vegitable', {
      pageTitle: 'Vegetable Page',
      path: '/vegetables',
      vegetables: vegetables,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      isAuthenticated: req.session.isLoggedIn
    });
  } catch (err) {
    console.error('Error fetching vegetables:', err);
    next(err);
  }
};


exports.farmer = async (req, res, next) => {
  const farmerName = req.params.farmerName;
  try {
    const farmer = await Farmer.findOne({ username: farmerName.trim() }); // Trim the username to ensure no leading/trailing spaces
    if (!farmer) {
      return res.redirect('/');
    }

    const products = await Product.find({ userId: farmer._id }); // Use userId to find products by this farmer
    res.render('shop/farmerProfile', {
      pageTitle: farmerName,
      path: '/farmers',
      isAuthenticated: req.session.isLoggedIn,
      farmer: farmer,
      products: products
    });
  } catch (err) {
    console.error('Error fetching farmer or products:', err);
    next(err);
  }
};

// Controller for fetching and displaying farm tours
exports.getTours = (req, res, next) => {
  FarmTour.find()
    .then(tours => {
      res.render('shop/tourss', {
        pageTitle: 'Farm Tours',
        path :'/farm-tour',
        tours: tours,
        isAuthenticated: req.session.isLoggedIn // Assuming you use sessions for authentication
      });
    })
    .catch(err => {
      console.error('Error fetching tours:', err);
      next(err); // Pass error to error handling middleware
    });
};


exports.getCourses = (req, res, next) => {
  Course.find()
    .populate('userId', 'username')
    .then(courses => {
      res.render('shop/course', {
        pageTitle: 'All Courses',
        courses: courses,
        user: req.user ,// Assuming user is available in request
        path :'course'
      });
    })
    .catch(err => {
      err.statusCode = err.statusCode || 500;
      next(err);
    });
};

exports.getConfirmTour = async (req, res, next) => {
  try {
      const tourId = req.params.tourId;
      const tour = await FarmTour.findById(tourId); 

      if (!tour) {
          const error = new Error('Tour not found');
          error.statusCode = 404;
          throw error;
      }

      // Assuming you have a middleware or route handler to provide CSRF token
      const csrfToken = req.csrfToken();

      res.render('shop/confirm-tour', {
          pageTitle: 'Confirm Tour',
          tour: tour,
          csrfToken: csrfToken,
          path: '/confirm-tour'
      });
  } catch (err) {
      err.statusCode = err.statusCode || 500;
      next(err);
  }
};
exports.postBooking = (req, res, next) => {
  const { date, slot, participants } = req.body; 
  const userId = req.user._id;
  const tourId = req.params.tourId;
  FarmTour.findById(tourId)
      .then(tour => {
          if (!tour) {
              const error = new Error('Tour not found');
              error.statusCode = 404;
              throw error;
          }
          const totalPrice = tour.price * participants;

      
          const booking = new Booking({
              tour: tourId,
              user: userId,
              date: new Date(date), 
              slot: slot,
              participants: participants,
              totalPrice: totalPrice
          });

          // Save the booking to the database
          return booking.save();
      })
      .then(savedBooking => {
          res.status(201).json({
              message: 'bhai ap API retuen kar rahy ho page render karna hai',
              booking: savedBooking
          });
      })
      .catch(err => {
          if (!err.statusCode) {
              err.statusCode = 500;
          }
          next(err); // Pass error to the error handling middleware
      });
};


exports.getUserEnrollments = async (req, res, next) => {

    try {
        const enrollments = await Enroll.find({ userId: req.user._id }).populate('courseId', 'courseName mode');
        
        const courseCount = enrollments.length;
        const courses = enrollments.map(enrollment => ({
            courseId: enrollment.courseId._id,
            courseName: enrollment.courseId.courseName,
            mode: enrollment.courseId.mode,
            enrollmentDate: enrollment.enrollmentDate.toISOString().split('T')[0]
        }));

        res.render('shop/userEnroll', {
            pageTitle: 'User Enrollments',
            path: '/user/enrollments',
            courses: courses,
            courseCount: courseCount,
            isAuthenticated: req.session.isLoggedIn
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getUserFarmTourBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch bookings for the logged-in user
    const bookings = await Booking.find({ user: userId }).populate('tour');

    // Check if bookings exist
    if (!bookings || bookings.length === 0) {
      return res.status(404).render('shop/userBooking', {
        pageTitle: 'Your Farm Tour Bookings',
        path: '/farm-tour-bookings',
        bookings: [],
        isAuthenticated: req.session.isLoggedIn,
      });
    }

    res.render('shop/userBooking', {
      pageTitle: 'Your Farm Tour Bookings',
      path: '/farm-tour-bookings',
      bookings: bookings,
      isAuthenticated: req.session.isLoggedIn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.getCourseCart = async (req, res, next) => {
  try {
      const course = await Course.findById(req.params.courseId); 
      if (!course) {
          return res.status(404).send('Course not found');
      }
      res.render('shop/course-cart',
         { 
          path: '/course-cart',
          pageTitle: 'Your Cart',
          course: course,
          isAuthenticated: req.session.isLoggedIn,
          });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};

exports.enrollCourse = async (req, res, next) => {
  try {
      const courseId = req.params.coruseId;
      console.log(courseId,"debug");
      const course = await Course.findById(courseId);
      console.log(course,"testing course");

      if (!course) {
          return res.status(404).send('Course not found');
      }

      if (course.mode === 'online') {
          const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [{
                  price_data: {
                      currency: 'usd',
                      product_data: {
                          name: course.courseName,
                          
                      },
                      unit_amount: course.courseFee * 100, 
                  },
                  quantity: 1,
              }],
              mode: 'payment',
              success_url: `${req.protocol}://${req.get('host')}/enroll-success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${req.protocol}://${req.get('host')}/enroll-cancel`,
              metadata: {
                courseId: course._id.toString() 
            }
          });

          res.render('shop/courseCheckout', {
            sessionId: session.id,
            course: course,
            pageTitle: 'Checkout',
            path: '/checkout',
            isAuthenticated: req.session.isLoggedIn,
        });
      } else if (course.mode === 'physical') {
         const userId = req.user._id;
         //console.log(userId);
         const enrollments = new Enroll({
          courseId : courseId,
          userId : userId,
         });
         //console.log(enrollments);
         await enrollments.save();
         res.render('shop/enroll',{
          course: course,
          paymentStatus : 'Un-paid',
          pageTitle: 'Enroll Success',
          path: '/enroll-success',
          isAuthenticated: req.session.isLoggedIn,
          
        } );

      } else {
          return res.status(400).send('Invalid enrollment mode');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};

exports.postEnrollSuccess = async (req, res) => {
  try {
     
      const userId = req.user._id;
      const { session_id } = req.query;

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session && session.payment_status === 'paid') {
          const courseId = session.metadata.courseId;

          const enrollment = new Enroll({
              courseId: courseId,
              userId: userId,
          });
           const course = await Course.findById(courseId)

          await enrollment.save();
          res.render('shop/enroll',{
            course: course,
            paymentStatus : 'paid',
            pageTitle: 'Enroll Success',
            path: '/enroll-success',
            isAuthenticated: req.session.isLoggedIn,
            
          } );

          
      } else {
          res.status(400).send('Payment not completed');
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};



exports.getCheckout = (req ,res ,next) =>{
  let products ;
  let total =0 ;
  req.user.populate('cart.items.productId')
  .execPopulate()
  .then(user =>{
    products = user.cart.items;
    products.map(p =>{
      total += p.quantity * p.productId.price
    })
    return stripe.checkout.sessions.create({
      payment_method_types :['card'],
      line_items: products.map(p =>{
        return {
          price_data :{
            currency : 'usd',
            product_data :{
              name : p.productId.title,
              description : p.productId.description,
            },
            unit_amount : p.productId.price *100,
          },
          quantity : p.quantity
        }
      }),
      mode :'payment',
      success_url : req.protocol +'://'+ req.get('host') + '/success/checkout',
      cancel_url: req.protocol + '://' + req.get('host') + '/success/cancel'
    }).then (session =>{
      res.render('shop/checkout',{
        path : '/checkout',
        pageTitle : 'Checkout',
        products : products,
        total : total,
        totalSum: total,
        sessionId : session.id
        }) 
    })
  }).catch(err =>{
    const error = new Error(err);
    error.httpStatusCode= 500;
    return next(error);
  })
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getCheckOutsucssess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId).then(order => {
    if (!order) {
      return next(new Error('order not found'))
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('not authorized'))
    }

    const InvoiceName = 'invoice-' + orderId + '.pdf';
    const pathInvoice = path.join('data', 'invoice', InvoiceName);
    const pdfdocument = new PDFDoc;
    pdfdocument.pipe(fs.createWriteStream(pathInvoice));
    pdfdocument.pipe(res);
    pdfdocument.fontSize(20).text('INVOICE');
    pdfdocument.fontSize(10).text('Date: ' + order.createdAt);
    order.products.forEach(prods =>{
      pdfdocument.fontSize(10).text(
        'Product Title ______ :-'   +prods.product.title +
        '___'  + prods.quantity + '*$ '  +prods.product.price + '=' +'$'+ prods.quantity*prods.product.price
      )
    })

    pdfdocument.end();

  })

}






