const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const Farmer = require('./models/farmer');
const multer = require('multer');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');
const session = require('express-session');
const CSRF = require('csurf')
const flash = require('connect-flash');
const MongoDbStore = require('connect-mongodb-session')(session);

const CSRFprotection = CSRF();

const MONGODB_url = 'mongodb+srv://hamza123:hamza123@cluster0.el7nk.mongodb.net/FYP?retryWrites=true&w=majority&appName=Cluster0'

const store = new MongoDbStore({
  uri: MONGODB_url,
  collection: 'session',
})

const filestoarge = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const dateStr = new Date().toISOString().replace(/:/g, '-');
    cb(null, dateStr + '-' + file.originalname);
  },
})

const fliterfile = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false)

  }


}

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const auth = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: filestoarge, fileFilter: fliterfile }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname , 'images')))
// adding session middleware 
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));


app.use(CSRFprotection);
app.use(flash());



app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  const findUser = (Model) => {
    return Model.findById(req.session.user._id)
      .then(user => {
        console.log(user,"a");
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch(err => {
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

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.role = req.session.user ? req.session.user.role : null;
  next();
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(auth);
app.use('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error)
  res.redirect('/500');
})


mongoose
  .connect(
    MONGODB_url,{
        useNewUrlParser: true,
  useUnifiedTopology: true,
    }
  )
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });

