import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import nodemailer from "nodemailer";

import Product from "../models/productModel.js";


//===========================================================

//load the signup page

export const loadRegister = async (req, res) => {

  try {
    res.render("reg");

  } catch (error) {
    console.log(error.message);
  }
};

//===========================================================

// Generate OTP
const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

//verifyemail
const sendVerifyEmail = async (name, email, otp) => {
  try {
    const trasnporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Verification email to Eatable",
      text: `Hi ${name},Welome! Your OTP is ${otp}`,
    };

    //send email
    trasnporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(`Email sent  ${info.response}`);
      }
    });

    return true;
  } catch (error) {
    console.log(error.message);
  }
};

// ==============================================================================================

//load the otp page

export const loadOtpVerification = async (req, res) => {

  try {
    res.render("getotp");

  } catch (error) {
    console.log(error.message);
  }
};

// user registration

export const registerUser = async (req, res) => {
  console.log(" ji");
  console.log(req.body);
  try {
    const { firstName, lastName, email, mobile, password, password_conf } =
      req.body;

    //check if all fields are filled
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobile ||
      !password ||
      !password_conf
    ) {
      return res
        .status(400)
        .send({ status: "failed", message: "All fields are required" });
    }

    if (password !== password_conf) {
      return res.status(400).send({
        status: "failed",
        message: "Password and confirm password do not match",
      });
    }

    console.log("Condition checked");

    //check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.send({ message: "Email already exist!!!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    //Generate a OTP
    const otp = await generateOTP();
    console.log("OTP :", otp);

    //Generate a temporary token
    const token = jwt.sign(
      { firstName, lastName, email, mobile, hashedPassword, otp },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );
    res.cookie("token", token, { httpOnly: true });
    // res.setHeader("Authorization", `Bearer ${token}`);

    let name = firstName + " " + lastName;

    // Send OTP to the user's email
    if (await sendVerifyEmail( name, email, otp)) {
      // Include the token in the response headers

      return res.redirect("/verifyotp");;
    } else {
      return res.status(500).send("Error sending OTP. Please try again later.");
    }
  } catch (error) {
    console.log("Error in registerUser:", error.message);
    res.status(500).send("Internal server error");
  }
};
//=========================================================



// Resend OTP
export const resendOTP = async (req, res) => {
  try {

    const token = req.cookies.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    // Generate a new OTP
    const newOTP = await generateOTP();

    // Updating the OTP in the decoded token
    decoded.otp = newOTP;

    console.log(decoded.exp, "decoded exp")

    delete decoded.exp;

    const { firstName, lastName, email, mobile, hashedPassword } = decoded;
    
    if (!email) {
      return res.status(400).send("Email not defined in the token");
    }

    const newToken = jwt.sign(
      { firstName, lastName, email, mobile, hashedPassword, otp : newOTP },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );

    // Send the new OTP to the user's email
    let name = firstName + " " + lastName;

    if (await sendVerifyEmail(name,email, newOTP)) {
      res.cookie("token", newToken, {
        httpOnly: true,
        expires: new Date(Date.now() + 120000),
      }); // Expires in 2 minutes (120,000 milliseconds)
      
      return res.status(200).send({
        message: "New OTP sent to email.",
        newToken: newToken, // Include the new token in the response body if needed
      });
    } else {
      return res
        .status(500)
        .send("Error sending new OTP. Please try again later.");
    }
  } catch (error) {
    console.log("Error in resendOTP:", error.message);
    res.status(500).send("Internal server error");
  }
};

//=========================================================

//verify OTP

export const verifyOTP = async (req, res) => {
  console.log("verifyotp ");
  const { otp } = req.body;
  const token = req.cookies.token;


  if (!token) {
    return res.status(400).send("Token missing or expired");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("this is my password", decoded.hashedPassword);
    if (decoded.otp !== otp) {
      return res.status(400).send("Invalid OTP");
    }
    console.log("decoded :", decoded);
    const newUser = new User({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      mobile: decoded.mobile,
      password: decoded.hashedPassword,
      isVerified: true,
      isActive:true,
    });

    await newUser.save();
    res.clearCookie("token");

    res.status(200);
    // .send("OTP verified successfully! Your account is now active.");
    res.redirect("/login");
  } catch (error) {
    console.log("Error in verifyOTP:", error.message);
    res.status(500).send("Internal server error");
  }
};

//================================================================

//userlogin

export const userLogin = async (req, res) => {
  try {
    res.render("forgotPass");
  } catch (error) {
    console.log(error.message);
  }
};

//================================================================
//userVerification

export const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "Missing email or password" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: "Invalid email format" });
    }

    const userData = await User.findOne({ email }).select("+password"); // Include password for comparison

    if (!userData) {
      return res.status(401).send({ message: "Incorrect email or password" }); // Avoid revealing if email exists
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).send({ message: "Incorrect email or password" });
    }
o
    // Generate token with user role information
    const token = jwt.sign(
      { id: userData._id, email: userData.email, isAdmin: userData.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("token", token);
    res.cookie("token", token, { httpOnly: true }); // Store token in a cookie
    // res.setHeader('Authorization', 'Bearer ' + token);
    // res.setHeader('Authorization', 'Bearer ' + token);
    if (userData.isAdmin) {
      // If, redirect to admin dashboard
      return res.redirect("/admin/dashboard");
    } else {
      // If not an admin, redirect to user Home
      return res.redirect("/home");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//===========================================================================

         //google login

export const googleSuccess = async (req, res) => {
  try {
    const profile = req.user.profile;
    if (!profile || !profile.emails || profile.emails.length === 0) {
      console.error('Google profile or email not found.');
      return res.status(400).json({ message: 'Google profile or email not found.' });
    }

    const email = profile.emails[0].value; // Access email from profile object

    console.log("email", email);

    let userData = await User.findOne({ email });

    console.log("googleuserdata", userData);
    
    if (userData) {
      console.log('User logged with Google:', userData);
      // Generate JWT token
      const token = jwt.sign(
        { id: userData._id, email: userData.email, isAdmin: userData.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Set the token in a cookie
      res.cookie('token', token, { httpOnly: true});

      // Redirect to home
      return res.redirect('/home');
    } else {
      console.log('User not registered:', email);
      return res.status(401).json({ message: 'User not registered' });
    }
  } catch (error) {
    console.error('Error in Google authentication:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//=========================================================

//  requestPasswordResetOTP

export const requestPasswordResetOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({
          success: false,
          message: "User with this email does not exist.",
        });
    }

    const otp = await generateOTP();
    console.log("OTP :", otp);

    const { firstName, lastName, mobile, password: hashedPassword } = user;

    // const token = jwt.sign({ id: user._id, otp }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const token = jwt.sign(
      { id: user._id, firstName, lastName, email, mobile, hashedPassword, otp },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );

    const name = `${firstName} ${lastName}`;

    if (await sendVerifyEmail(name, email, otp)) {
      res.cookie("resetToken", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      }); // Expires in 10 minutes

      res
        .status(200)
        .send({
          success: true,
          message: "OTP sent to your email for password reset.",
        });
    }
  } catch (error) {
    console.error("Error in requestPasswordResetOTP:", error.message);
    res
      .status(500)
      .send({
        success: false,
        message: "Error sending OTP. Please try again later.",
      });
  }
};



//verifyPasswordResetOTP

export const verifyPasswordResetOTP = async (req, res) => {
  const { otp } = req.body;
  const token = req.cookies.resetToken;

  if (!token) {
    return res
      .status(400)
      .send({ success: false, message: "Token missing or expired" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.otp !== otp) {
      return res.status(400).send({ success: false, message: "Invalid OTP" });
    }

    res
      .status(200)
      .send({
        success: true,
        message: "OTP verified. You can now reset your password.",
      });
  } catch (error) {
    res
      .status(500)
      .send({
        success: false,
        message: "Error verifying OTP. Please try again later.",
      });
  }
};



//resetPassword

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const token = req.cookies.resetToken;

  if (!token) {
    return res
      .status(400)
      .send({ success: false, message: "Token missing or expired" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.clearCookie("resetToken");
    res
      .status(200)
      .send({
        success: true,
        message:
          "Password reset successful. You can now log in with your new password.",
      });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res
      .status(500)
      .send({
        success: false,
        message: "Error resetting password. Please try again later.",
      });
  }
};

// ==================================================================================


export const loadHome = async (req, res, next) => {
  try {

    console.log("home page rendered")
    const products = await Product.find({isActive: true}).limit(8).populate("category")  //{  }
    
    console.log("homepage products:",products)

    res.render("index", { products });
  } catch (error) {

    console.log("error catched")
    next(error);
  }
};



// ===========================================/Product Detail Page/=====================================================================

//load product list

export const loadProductDetails = async (req, res) => {
  try {

     const productId = req.params.id;

      const products = await Product.findById(productId).populate('category');

      console.log("Product detail :", products)

      if (products) {
        const relatedProducts = await Product.find({
            category: products.category._id,
            _id: { $ne: productId } // not require current products
        }).limit(4);

        console.log("related products", relatedProducts)

        return res.render('productDetails', { products, relatedProducts });
    }
    
    res.status(404).send('Product not found');
      
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};


// post Review 

export const postReview = async (req, res) => {
  try {
    const productId = req.params.id;

    const { name, email, rating, review } = req.body;

    const products = await Product.findById(productId);

    if (products) {
      products.reviews.push({ name, email, rating, review });

      await products.save();

      return res
        .status(200)
        .json({
          message: "Review added successfully",
          review: products.reviews[products.reviews.length - 1],
        });
    }

    res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

//show the pssted reviews

export const getReviews = async (req, res) => {
  try {
      const productId = req.params.id;
      const products = await Product.findById(productId).populate('reviews');

      console.log("Products in get reviews", products)

      if (products) {
          return res.status(200).json(products.reviews);
      }
      
      res.status(404).json({ message: "Product not found" });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};




//==========================================Shop Product Page===========================================================


export const loadShopProduct = async (req, res) => {
  try {

    const products = await Product.find({isActive: true}).populate("category")

    // extracting unique category names from the populated products
    const uniqueCategories = [...new Set(products.map(product => product.category.name))];

    // Prepare categories for the view
    const categories = uniqueCategories.map(name => {
      return {
        categoryName: name,
        count: products.filter(product => product.category.name === name).length
      };
    });

    
      res.render('shopPage',{products: products,uniqueCategories: categories});
      
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};







//user Logout

export const logout = async (req, res) => {
  try {
    console.log("userlogout");
    // Clear the JWT cookie
    res.clearCookie("token");

    // Redirect to the homepage
    res.redirect("/");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};