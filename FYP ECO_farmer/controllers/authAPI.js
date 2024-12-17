

const User = require('../models/user');
const Farmer = require ('../models/farmer');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')

const jwt = require('jsonwebtoken');


exports.posttLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed.',
            errors: errors.array(),
            data: {
                email,
                password
            }
        });
    }

    const findUserAndLogin = async (Model) => {
        try {
            const user = await Model.findOne({ email: email });
            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password.',
                    errors: [{ param: 'email', msg: 'Invalid email or password.' }]
                });
            }

            const doMatch = await bcrypt.compare(password, user.password);
            if (doMatch) {
                // Generate JWT token
                const token = jwt.sign(
                    { userId: user._id, role: Model === Farmer ? 'farmer' : 'user' },
                    'farmerandconsumersecrete', // Secret key
                    { expiresIn: '24h' } // Expiration time (24 hours)
                );

                // Respond with success and JWT token
                return res.status(200).json({
                    message: 'Login successful.',
                    token: token,
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        role: Model === Farmer ? 'farmer' : 'user'
                    }
                });
            }

            return res.status(401).json({
                message: 'Invalid email or password.',
                errors: [{ param: 'password', msg: 'Invalid email or password.' }]
            });
        } catch (err) {
            console.log(err);
            return next(err);
        }
    };

    try {
        const user = await User.findOne({ email: email });
        if (user) {
            await findUserAndLogin(User); // Login the user if found in User model
        } else {
            await findUserAndLogin(Farmer); // If not found in User, try Farmer model
        }
    } catch (err) {
        console.log(err);
        const error = new Error('Server error occurred.');
        error.httpStatusCode = 500;
        return next(error);
    }
};


exports.postSignUp = async (req, res, next) => {
    const { username, email, password, confirmPassword, role, farmName, farmLocation, farmDescription, phoneNumber, address } = req.body;
  
    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        validationErrors: [{ param: 'confirmPassword' }],
      });
    }
  
    try {
      // Check if user or farmer already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already exists as Customer',
          validationErrors: [{ param: 'email' }],
        });
      }
  
      const existingFarmer = await Farmer.findOne({ email: email });
      if (existingFarmer) {
        return res.status(400).json({
          message: 'Email already exists as Farmer',
          validationErrors: [{ param: 'email' }],
        });
      }
  
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new user or farmer based on role
      if (role === 'farmer') {
        const newFarmer = new Farmer({
          username,
          email,
          password: hashedPassword,
          role,
          farmName,
          farmLocation,
          farmDescription,
        });
  
        // Save the new farmer to the database
        await newFarmer.save();
        return res.status(201).json({
          message: 'Farmer account created successfully!',
          user: newFarmer,
        });
      } else if (role === 'customer') {
        const newUser = new User({
          username,
          email,
          password: hashedPassword,
          role,
          customerDetails: {
            phoneNumber,
            address,
          },
        });
  
        // Save the new user to the database
        await newUser.save();
        return res.status(201).json({
          message: 'Customer account created successfully!',
          user: newUser,
        });
      }
  
      // If no valid role, respond with error
      return res.status(400).json({
        message: 'Invalid role provided',
      });
    } catch (err) {
      next(err); // Handle any errors during the signup process
    }
  };
