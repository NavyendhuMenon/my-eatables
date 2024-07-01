import express from "express"
const userRoute = express();

import *as userController from "../controllers/userController.js"
import *as auth from "../middleware/auth.js"
import cookieParser from "cookie-parser";
import *as cartController from "../controllers/cartController.js"
import *as profileController from "../controllers/userProfileController.js"
import passport from "../helper/passportHelper.js"
import nocache from "nocache"
userRoute.set('view engine','ejs')
userRoute.set('views','./views/User')
userRoute.use(express.json()) // Parses req with JSON payloads
userRoute.use(express.urlencoded({ extended: true })) // Parses req with urlencoded payloads
userRoute.use(cookieParser());
userRoute.use(nocache());

import { isUser } from "../middleware/roleChecker.js";


userRoute.get('/register',userController.loadRegister)
userRoute.post('/register', userController.registerUser)

userRoute.get('/verifyotp',userController.loadOtpVerification)
userRoute.post('/verifyotp',userController.verifyOTP)
userRoute.post('/resendotp',userController.resendOTP);

userRoute.get ('/login/google',passport.authenticate('google', { scope: ['profile', 'email'], session: false}))
userRoute.get('/login/google/callback',passport.authenticate('google', { failureRedirect: '/login' , session: false}),userController.googleSuccess)

userRoute.get('/login',auth.isLogout,userController.userLogin) 
userRoute.get('/',auth.isLogout,userController.userLogin)
userRoute.post('/login',auth.isLogout,userController.verifyLogin)


userRoute.post('/request-password-reset-otp',userController.requestPasswordResetOTP);



// Route to verify OTP for password reset
userRoute.post('/verify-password-reset-otp', userController.verifyPasswordResetOTP);

// Route to reset password
userRoute.post('/reset-password', userController.resetPassword);

userRoute.get('/home',auth.isLogin,isUser,userController.loadHome)

userRoute.get('/productDetails/:id',auth.isLogin,isUser, userController.loadProductDetails, userController.getReviews)
userRoute.post('/productDetails/:id/review', auth.isLogin, isUser, userController.postReview);


userRoute.get('/shopPage',auth.isLogin,isUser, userController.loadShopProduct)


userRoute.get('/wishlist',auth.isLogin,isUser,cartController.loadwishlist) 
userRoute.post('/wishlist/add/:id', auth.isLogin,isUser,cartController.addToWishlist)
userRoute.delete('/wishlist/remove/:id', auth.isLogin,isUser,cartController.removeFromWishlist)




userRoute.get('/mycart',auth.isLogin,isUser,cartController.loadCart)
userRoute.post('/mycart',auth.isLogin,isUser,cartController.addToCart)
userRoute.delete('/mycart', auth.isLogin, isUser, cartController.deleteFromCart);
userRoute.patch('/mycart/update', auth.isLogin, isUser, cartController.incrementQuantity);


userRoute.get ('/profile',auth.isLogin,isUser, profileController.loadProfile)
userRoute.post('/editprofile', auth.isLogin,isUser, profileController.editProfile)
userRoute.post('/changepassword', auth.isLogin, isUser, profileController.changePassword)


userRoute.post('/addaddresses', auth.isLogin,isUser, profileController.addAddress)

userRoute.get('/logout', userController.logout)




export default userRoute