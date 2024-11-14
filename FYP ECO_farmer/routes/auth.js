const express = require('express');
const auth = require('../controllers/auth');
const {check,body} = require('express-validator');
const router = express.Router();
const User = require('../models/user')


router.get('/login',auth.getLogin);

router.post('/login',[
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.'),
    //.normalizeEmail(),
    body('password','password have to be  valid')
    .isLength({min : 5})
    .isAlphanumeric()
    .trim(),
],auth.postLogin);

router.post('/Logout',auth.postLogout);

router.get('/signup',auth.getSignup);

router.get('/reset',auth.getReset);

router.post('/signup',[
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value,{req})=>{
        return User.findOne({email : value}).then(userdoc=>{
            if(userdoc){
                return Promise.reject(
                    'This E-mail already exist please pick other one'
                )
            }
        })
    })
    .normalizeEmail(),
    body('password','Please enter valid password both text and number al least 5 characters')
    .isLength({min :5})
    .isAlphanumeric()
    .trim(),
    body('confirmPassword').
    trim()
    .custom((value,{req})=>{
        if (value !== req.body.password){
            throw new Error('Password are not match');
        }
        return true ;
    }) 
],auth.postSignUp);

router.post('/reset', auth.postReset);


module.exports = router;