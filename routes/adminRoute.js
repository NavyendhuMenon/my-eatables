import express from "express"
const adminRoute = express();

import *as adminController from "../controllers/adminController.js"
import *as productController from "../controllers/productController.js"
import *as auth from "../middleware/auth.js"
import cookieParser from "cookie-parser";

import cors from "cors"
import passport from "passport"
// import passportStratergy from "./"npm
import multer from "multer"
// const upload=multer({dest:"uploads/"})


adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/Admin')
adminRoute.use(express.json()) // Parses req with JSON payloads
adminRoute.use(express.urlencoded({ extended: true })) // Parses req with urlencoded payloads
adminRoute.use(cookieParser());
adminRoute.use(express.static('uploads'))


import { isAdmin } from "../middleware/roleChecker.js";


adminRoute.get('/dashboard',auth.isLogin,isAdmin,adminController.loadDash)


adminRoute.get('/customer',auth.isLogin ,isAdmin,adminController.loadCustomerDash)
adminRoute.get('/blockCustomer',auth.isLogin ,isAdmin, adminController.blockUser)
adminRoute.get('/unBlockCustomer',auth.isLogin ,isAdmin,adminController.unblockUser)


adminRoute.get ('/category',auth.isLogin ,isAdmin, productController.loadCategory)

adminRoute.get ('/editCategories',auth.isLogin ,isAdmin,productController.loadEditCategory)
adminRoute.get('/unBlockCategory',auth.isLogin ,isAdmin,productController.unblockCategory)
adminRoute.get('/blockCategory',auth.isLogin ,isAdmin,productController.blockCategory)
adminRoute.post('/addCategory',auth.isLogin ,isAdmin,productController.addCatagories)
adminRoute.post('/updateCategory',auth.isLogin ,isAdmin,productController.EditCategory)


adminRoute.get ('/products',auth.isLogin ,isAdmin,productController.loadProduct)
adminRoute.post('/products',auth.isLogin ,isAdmin,productController.upload.array('image',5),productController.cropImages, productController.addNewProduct)
adminRoute.get ('/productList',auth.isLogin ,isAdmin,productController.loadProductList)
adminRoute.get('/unBlockProduct',auth.isLogin ,isAdmin,productController.unblockProduct)
adminRoute.get('/blockProduct',auth.isLogin ,isAdmin,productController.blockProduct)
adminRoute.get('/editProduct', auth.isLogin, isAdmin, productController.editproductLoad);
adminRoute.post('/editProduct', auth.isLogin, isAdmin, productController.upload.array('image', 5),productController.cropImages,  productController.EditProduct);
adminRoute.delete('/deleteImage',auth.isLogin, isAdmin,productController. deleteProductImage);





adminRoute.get('/logout', adminController.logout)



export default adminRoute