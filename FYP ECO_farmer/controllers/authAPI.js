

const User = require('../models/user');
const Farmer = require ('../models/farmer');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const nodemailer = require('nodemailer');
const sendgridtransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');

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
                req.session.isLoggedIn = true;
                req.session.user = user;

                // Save the session and send a success response
                return req.session.save(err => {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }

                    // Respond with success and user role
                    return res.status(200).json({
                        message: 'Login successful.',
                        user: {
                            id: user._id,
                            email: user.email,
                            username: user.username,
                            role: Model === Farmer ? 'farmer' : 'user'
                        }
                    });
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
