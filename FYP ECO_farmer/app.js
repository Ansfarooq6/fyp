const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const MongoDbStore = require('connect-mongodb-session')(session);

const Farmer = require('./models/farmer');
const User = require('./models/user');
const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const auth = require('./routes/auth');
const AuthAPI = require('./routes/AuthAPI');
const AdminAPI = require('./routes/adminAPI')

const MONGODB_url = 'mongodb+srv://hamza123:hamza123@cluster0.el7nk.mongodb.net/FYP?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
const store = new MongoDbStore({
    uri: MONGODB_url,
    collection: 'session',
});

// File storage and filtering for multer
const filestorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        const dateStr = new Date().toISOString().replace(/:/g, '-');
        cb(null, dateStr + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// Middleware
app.use(cors());
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from this React frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: filestorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Session middleware
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
app.use(flash());

// Pass authentication status and user role to views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.role = req.session.user ? req.session.user.role : null;
    next();
});

// Authentication middleware
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }

    const findUser = (Model) => {
        return Model.findById(req.session.user._id)
            .then((user) => {
                if (!user) {
                    return next();
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.error('Error fetching user:', err);
                next(err);
            });
    };

    if (req.session.user.role === 'farmer') {
        findUser(Farmer);
    } else {
        findUser(User);
    }
});

// Routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(auth);
app.use(AuthAPI);
app.use(AdminAPI);

// Error handling routes
app.use('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    res.redirect('/500');
});

// MongoDB connection
mongoose
    .connect(MONGODB_url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        app.listen(3000, () => console.log('Server is running on port 3000'));
    })
    .catch((err) => {
        console.log(err);
    });
