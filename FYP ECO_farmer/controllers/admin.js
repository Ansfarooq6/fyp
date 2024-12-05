const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Product = require('../models/product');
const Course = require('../models/course');
const Order = require('../models/order');
const Tour = require('../models/tours');
const Booking = require('../models/booking')
const Enroll = require('../models/enrollment');
const filehelper = require('../util/helperfile');


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    isAuthenticated: req.session.isLoggedIn,
    role: req.session.user.role // Add role here
  });
};

exports.postAddProduct = (req, res, next) => {

  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const category = req.body.category;
  const description = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        category: category
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      isAuthenticated: req.session.isLoggedIn,
      role: req.session.user.role // Add role here
    });
  }

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        category: category
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: [],
      isAuthenticated: req.session.isLoggedIn,
      role: req.session.user.role // Add role here
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    category: category,
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user._id
  });

  product
    .save()
    .then(result => {
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      next(err); // Pass error to next middleware
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        errorMessage: null,
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn,
        role: req.session.user.role // Add role here
      });
    })
    .catch(err => {
      next(err); // Pass error to next middleware
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const image = req.file;

  Product.findById(prodId)
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        filehelper.deletefile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save();
    })
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      next(err); // Pass error to next middleware
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.session.user._id })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn,
        role: req.session.user.role  // Pass the role to the view
      });
    })
    .catch(err => {
      next(err); // Pass error to next middleware
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then(product => {
    if (!product) {
      return next(new Error('Product not found'));
    }
    filehelper.deletefile(product.imageUrl);
    return Product.findByIdAndRemove(prodId);
  }).then(() => {


    // Send a response with an alert and redirect script
    res.status(200).send(`
      <script>
        alert('Product deleted successfully.');
        window.location.href = '/admin/products';
      </script>
    `);
    console.log('DESTROYED PRODUCT');
    res.status(200).json({ message: "Deleted successfully" });
  })
    .catch(err => {
      res.status(500).json({ message: 'Deleting product failed' }); // Pass error to next middleware
    });
};

exports.postDeleteProductss = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);

    if (!product) {
      return next(new Error('Product not found'));
    }

    // Delete the file associated with the product
    filehelper.deletefile(product.imageUrl);

    // Remove the product from the database
    await Product.findByIdAndRemove(prodId);

    console.log('Product deleted successfully.');

    // Render a response with an alert and redirect script
    res.status(200).send(`
      <script>
        alert('Product deleted successfully.');
        window.location.href = '/admin/products';
      </script>
    `);
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: 'Deleting product failed' });
  }
};

exports.getCoruse = (req, res, next) => {
  res.render('admin/course', {
    pageTitle: 'Add Course',
    path: '/course',
    editing: false, // Not editing, creating a new course
    errorMessage: null, // No error messages initially
    validationErrors: [], // No validation errors initially
    oldInput: { // Empty input fields for a new course
      courseName: '',
      availableSlots: '',
      availableDays: '',
      mode: '',
      courseDuration: '',
      courseFee: '',
      lastDateToApply: '',
      courseDescription: ''
    },
    csrfToken: req.csrfToken(), // CSRF token for secure form submission
    isAuthenticated: req.session.isLoggedIn // Session authentication
  });
};

exports.postAddCourse = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    // Handle validation errors here, e.g., send an error response
    return res.status(422).json({ errors: errors.array() }); // Adjust as needed
  }

  const { 
    courseName,
    availableSlots,
    availableDays,
    mode,
    courseDuration,
    courseFee,
    lastDateToApply,
    courseDescription,
  } = req.body;

  try {
    const course = new Course({
      courseName: courseName,
      availableSlots: availableSlots,
      availableDays: availableDays.split(','), // Assuming availableDays is comma-separated in the request
      mode: mode,
      courseDuration: courseDuration,
      courseFee: courseFee,
      lastDateToApply: new Date(lastDateToApply), // Convert to Date object
      courseDescription: courseDescription,
      userId: req.user._id, // Assuming you have a user ID in the request (e.g., from session)
    });

    await course.save();
    const userId = await req.user._id;
    const coruse = await Course.find({ userId: userId });
    res.status(201).render('admin/adminCoruse',{
      pageTitle: 'Course',
      path: '/admin/course',
      courses: coruse

    })
  } catch (err) {
    console.error('Error saving course:', err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err); // Pass error to error handling middleware
  }
};

exports.getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enroll.find()
      .populate('courseId')
      .populate('userId')
      .exec();

    res.render('admin/manage-enroll', {
      enrollments: enrollments,
      pageTitle: 'All Enrollments',
      path: '/admin/enrollments',
      isAuthenticated: req.session.isLoggedIn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};


exports.getTour = (req, res, next) => {
  res.render('admin/addtour', {
    pageTitle: 'Add Tour',
    path: '/tour',
    editing: false,
    errorMessage: null,
    oldInput: {
      title: '',
      description: '',
      highlights: '',
      location: '',
      duration: '',
      maxParticipants: '',
      price: '',
      slots: ''
    },
    isAuthenticated: req.session.isLoggedIn
  });
};



exports.postAddFarmTour = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/addtour', {
      pageTitle: 'Add Farm Tour',
      path: '/admin/add-farm-tour',
      errorMessage: errors.array(),
      oldInput: {
        title: req.body.title,
        description: req.body.description,
        highlights: req.body.highlights,
        location: req.body.location,
        duration: req.body.duration,
        maxParticipants: req.body.maxParticipants,
        price: req.body.price,
        slots: req.body.slots
      }
    });
  }

  const {
    title,
    description,
    highlights,
    date,
    location,
    duration,
    maxParticipants,
    price,
    slots
  } = req.body;

  try {
    const farmTour = new Tour({
      title: title,
      description: description,
      highlights: highlights.split(',').map(item => item.trim()),
      date: date,
      location: location,
      duration: duration,
      maxParticipants: maxParticipants,
      price: price,
      slots: slots.split(',').map(slot => slot.trim()),
      userId: req.user._id
    });
    await farmTour.save();
    res.redirect('/tours');
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};



exports.getFarmerOrders = async (req, res, next) => {
  try {
    const farmerId = req.user._id;


    const orders = await Order.find({ 'products.product.userId': farmerId })
      .populate('user.userId')
      .exec();

    res.render('admin/farmer-orders', {
      pageTitle: 'Farmer Orders',
      path: '/admin/farmer-orders',
      orders: orders,
      path: '/farmer order',
      isAuthenticated: req.session.isLoggedIn
    });
  } catch (err) {
    console.error('Error fetching farmer orders:', err);
    next(err); // Pass error to error handling middleware
  }
};

exports.getFarmerBookings = async (req, res, next) => {
  try {
    const farmerId = req.user._id;

    const farmerTours = await Tour.find({ userId: farmerId }).select('_id');
    const farmerTourIds = farmerTours.map(tour => tour._id);

    const bookings = await Booking.find({ tour: { $in: farmerTourIds } })
      .populate('user', 'email username customerDetails')
      .populate('tour', 'title')
      .select('tour user date slot participants totalPrice username phoneNumber');

    res.render('admin/manage-booking', {
      pageTitle: 'Farmer Bookings',
      path: '/farmer-bookings',
      bookings: bookings,
      isAuthenticated: req.session.isLoggedIn
    });
  } catch (err) {
    console.error('Error fetching farmer bookings:', err);
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};


exports.getAdminTours = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const tours = await Tour.find({ userId: adminId });

    res.render('admin/admintour', {
      pageTitle: 'Admin Tours',
      path: '/admin/tours',
      tours: tours,
      isAuthenticated: req.session.isLoggedIn
    });
  } catch (err) {
    console.error('Error fetching admin tours:', err);
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getEditTour = (req, res, next) => {
  const csrfToken = req.csrfToken();

  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const tourId = req.params.tourId;
  Tour.findById(tourId)
    .then(tour => {
      if (!tour) {
        return res.redirect('/');
      }
      res.render('admin/addtour', {
        pageTitle: 'Edit tour',
        path: '/admin/edit-tour',
        editing: editMode,
        csrfToken: csrfToken,
        tour: tour,
        errorMessage: null,
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn,
        role: req.session.user.role // Add role here
      });
    })
    .catch(err => {
      next(err); // Pass error to next middleware
    });
};



exports.postEditTour = async (req, res, next) => {
  const tourId = req.body.tourId;
  const updatedTitle = req.body.title;
  const updatedDescription = req.body.description;
  const updatedHighlights = req.body.highlights;
  const updatedLocation = req.body.location;
  const updatedDuration = req.body.duration;
  const updatedMaxParticipants = req.body.maxParticipants;
  const updatedPrice = req.body.price;
  const updatedSlots = req.body.slots;


  try {
    const tour = await Tour.findById(tourId);

    if (!tour) {
      const error = new Error('Tour not found.');
      error.statusCode = 404;
      throw error;
    }

    // Update tour fields
    tour.title = updatedTitle;
    tour.description = updatedDescription;
    tour.highlights = updatedHighlights.split(',').map(highlight => highlight.trim());
    tour.location = updatedLocation;
    tour.duration = updatedDuration;
    tour.maxParticipants = updatedMaxParticipants;
    tour.price = updatedPrice;
    tour.slots = updatedSlots.split(',').map(slot => slot.trim());

    // Save updated tour
    const result = await tour.save();

    res.redirect('/admin/Tour');
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


exports.postDeleteTour = async (req, res, next) => {
  const tourId = req.body.tourId;
  const csrfToken = req.csrfToken();

  try {
    const tour = await Tour.findById(tourId);

    if (!tour) {
      const error = new Error('Tour not found.');
      error.statusCode = 404;
      throw error;
    }

    if (tour.userId.toString() !== req.user._id.toString()) {
      const error = new Error('Not authorized to delete this tour.');
      error.statusCode = 403;
      throw error;
    }

    // Delete the tour
    await Tour.findByIdAndRemove(tourId);

    res.redirect('/admin/Tour');
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getEditCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const editing = req.query.edit === 'true';

  if (!editing) {
    console.log("ssss")
    return res.redirect('/');
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.redirect('/');
    }

    res.render('admin/course', {
      pageTitle: 'Edit Course',
      path: '/admin/edit-course',
      editing: true, // Editing mode enabled
      course: course, // Populate form with course data
      errorMessage: null, // No errors initially
      validationErrors: [], // No validation errors initially
      oldInput: { // Set to match the existing course data
        courseName: course.courseName,
        availableSlots: course.availableSlots,
        availableDays: course.availableDays.join(', '), // Join array for display
        mode: course.mode,
        courseDuration: course.courseDuration,
        courseFee: course.courseFee,
        lastDateToApply: course.lastDateToApply.toISOString().split('T')[0],
        courseDescription: course.courseDescription
      },
      csrfToken: req.csrfToken(), // CSRF token for secure form submission
      isAuthenticated: req.session.isLoggedIn // Session authentication
    });
  } catch (error) {
    console.error(error);
    res.redirect('/500');
  }
};



exports.postEditCourse = async (req, res, next) => {
  const {
    courseId,
    courseName,
    availableSlots,
    availableDays,
    mode,
    courseDuration,
    courseFee,
    lastDateToApply,
    courseDescription
  } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/course', {
      pageTitle: 'Edit Course',
      path: '/admin/edit-course',
      editing: true,
      course: {
        _id: courseId,
        courseName,
        availableSlots,
        availableDays,
        mode,
        courseDuration,
        courseFee,
        lastDateToApply,
        courseDescription
      },
      errorMessage: errors.array(),
      validationErrors: errors.array(),
      csrfToken: req.csrfToken(),
      isAuthenticated: req.session.isLoggedIn
    });
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.redirect('/admin/adminCoruse');
    }

    course.courseName = courseName;
    course.availableSlots = availableSlots;
    course.availableDays = availableDays.split(',').map(day => day.trim());
    course.mode = mode;
    course.courseDuration = courseDuration;
    course.courseFee = courseFee;
    course.lastDateToApply = new Date(lastDateToApply);
    course.courseDescription = courseDescription;

    await course.save();

    res.redirect('/admin/adminCoruse');
  } catch (error) {
    console.error(error);
    res.redirect('/500');
  }
};


exports.getAdminCourses = async (req, res, next) => {
  try {
    const userId = await req.user._id;
    const coruse = await Course.find({ userId: userId });

    res.render('admin/adminCoruse', {
      pageTitle: 'Your Courses',
      path: '/admin/courses',
      courses: coruse,
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: null
    });
  } catch (err) {
    console.error('Error fetching admin courses:', err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};



exports.postDeleteCourse = async (req, res, next) => {
  try {
    const courseId = req.body.courseId; // Assuming courseId is passed in the request body

    // Find and delete the course
    const course = await Course.findByIdAndRemove(courseId);

    if (!course) {
      req.flash('error', 'Course not found.'); // Optionally set a flash message
      return res.redirect('/admin/courses');
    }

    req.flash('success', 'Course deleted successfully.'); // Optionally set a success message
    res.redirect('/admin/adminCoruse'); // Redirect to the admin courses page
  } catch (err) {
    console.error(err);
    res.redirect('/admin/courses'); // Fallback redirection in case of an error
  }

};
