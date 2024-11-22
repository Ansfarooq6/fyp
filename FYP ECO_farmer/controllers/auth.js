const User = require('../models/user');
const Farmer = require ('../models/farmer');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const nodemailer = require('nodemailer');
const sendgridtransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');

const mailtransport = nodemailer.createTransport(
    sendgridtransport({
        auth: {
            api_key: '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'
        }
    })
);

exports.getLogin = (req, res, next) => {
    //console.log(req.get('Cookie').split('=')[1]);
    //const isLoggedIn = req.get('Cookie').split('=')[1];
    let message = req.flash('error');
    if (message.lenght > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/newLogin', {
        path: '/login',
        pageTitle: "login",
        errorMessage: message,
        oldInputs: {
            email: '',
            password: ''
        },
        validationErrors: [],
    })
}
exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('Authenticated user:', req.session.user); // or req.user depending on your setup
        return res.status(422).render('auth/newLogin', {
            path: '/login',
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            oldInputs: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        });
    }

    const findUserAndLogin = async (Model) => {
        try {
            const user = await Model.findOne({ email: email });
            if (!user) {
                return res.status(422).render('auth/newLogin', {
                    path: '/login',
                    pageTitle: "Login",
                    errorMessage: 'Invalid email or password.',
                    oldInputs: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [{ param: 'email' }],
                });
            }

            const doMatch = await bcrypt.compare(password, user.password);
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err => {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }

                    // Redirect based on user role or model type
                    if (Model === Farmer) {
                        return res.redirect('/admin/products'); // Redirect farmers to admin dashboard
                    } else {
                        return res.redirect('/'); // Redirect customers to the homepage
                    }
                });
            }

            return res.status(422).render('auth/newLogin', {
                path: '/login',
                pageTitle: "Login",
                errorMessage: 'Invalid email or password.',
                oldInputs: {
                    email: email,
                    password: password,
                },
                validationErrors: [{ param: 'password' }],
            });
        } catch (err) {
            console.log(err);
            return next(err);
        }
    };

    try {
        const user = await User.findOne({ email: email });
        if (user) {
            await findUserAndLogin(User); // Login the user if found
        } else {
            await findUserAndLogin(Farmer); // If not found in User collection, try Farmer
        }
    } catch (err) {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getSignup = (req, res, next) => {
    let massgae = req.flash('error');
    if (massgae.lenght > 0) {
        massgae = massgae[0];
    } else {
        massgae = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: "signup",
        isAuthenticated: false,
        errormsg: massgae,
        oldInputs: {
            email: '',
            password: '',
            confirmPassword: '',
        },
        validationErrors: []
    })
}

exports.postSignUp = async (req, res, next) => {
    const { username, email, password, confirmPassword, role, farmName, farmLocation, farmDescription, phoneNumber, address } = req.body;
    //console.log(req.body)

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).render('auth/signup', {
        errormsg: 'Passwords do not match',
        pageTitle:'signup',
        path:'/signup',
        oldInputs: req.body,
        validationErrors: [{ param: 'confirmPassword' }]
      });
    }
  
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).render('auth/signup', {
            errormsg: 'Email already exists as Customer ',
            pageTitle:'signup',
            path:"/signup",
            oldInputs: req.body,
            validationErrors: [{ param: 'email' }]
          });
      }
      const existingFarmer = await Farmer.findOne({ email : email});
      if(existingFarmer) {
        return res.status(400).render('auth/signup', {
            errormsg: 'Email already exists as farmer ',
            pageTitle:'signup',
            path:"/signup",
            oldInputs: req.body,
            validationErrors: [{ param: 'email' }]
          });
      }
  
      //  Create new user object based on role
      if (role === 'farmer') {
        const newFarmer = new Farmer({
          username: username,
          email: email,
          password: password,
          role : role,
          farmName: farmName,
          farmLocation: farmLocation,
          farmDescription: farmDescription
        });
  
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        newFarmer.password = hashedPassword;
  
        // Save farmer to database
        await newFarmer.save();
      } else if (role === 'customer') {
        const newUser = new User({
          username: username,
          email: email,
          password: password,
          role: role,
          customerDetails :{
            phoneNumber: phoneNumber,
            address: address,
          }
        });
  
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        newUser.password = hashedPassword;
  
        // Save user to database
        await newUser.save();
      }
  
      // Redirect or authenticate user after signup
      res.redirect('/login');
    } catch (err) {
      next(err);
    }
};


exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    })
}

//////////////////////reset authentication controlers

exports.getReset = (req, res, next) => {
    res.render('auth/resetform', {
        pageTitle: "password reset",
        path: "/passwordreset",

    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        //const email = req.body.email;
        User.findOne({ email: req.body.email }).then(user => {
            if (!user) {
                req.flash('error', ' no account found associated with this email');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        }).then(result => {
            res.redirect('/')
            return mailtransport.sendMail({
                to: email,
                from: 'noreply@node-shop.com',
                subject: 'Request for password reset',
                html: `<p>Request for password recovery</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>`
            })
        }).catch(err => {
            const error = new Error(err);
            error.httpstatusCode = 500;
            return next(error)
        });

    })
}

exports.getNewpassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }).then(user => {
        res.render('auth/new-password', {
            pageTitle: ' new password',
            path: '/new-password',
            userId: user._id.toString(),
            passwordToken: token,
        })
    })
}

exports.PostNewPasword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    user.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now(), _id: userid } })
        .then(user => {
            resetUser = user
            return bcrypt.hashpassword(newPassword, 12).then(hashpassword => {
                resetUser.password = hashpassword;
                resetUser.resetToken = undefined;
                resetUser.resetTokenExpiration = undefined;
                return resetUser.save();
            }).then(result => {
                res.redirect('/login')
            })
                .catch(err => {
                    const error = new Error(err);
                    error.httpstatusCode = 500;
                    return next(error);
                })

        })
}

