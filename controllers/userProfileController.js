
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import Product from "../models/productModel.js";
import { Address } from "../models/addressModel.js";




//=== loadMyProfile ====

export const loadProfile = async (req, res) => {

    try {
      
      const userId = req.user.id; 
      
      const userData = await User.findById(userId).populate('addresses');

     console.log("User details:", userData)

     if (!userData){

        console.log("User doesnot exist !!!!")
     }
      res.render("myProfile", {userData});
  
    } catch (error) {
      console.log(error.message);
    }
  };


  //=== editProfile =====+

 export  let editProfile = async (req, res) => {

    const userId = req.user._id
    const { firstName, lastName, email, mobile } = req.body

    try {
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, email, mobile },
            { new: true, runValidators: true }

            //{new : true} By default, findByIdAndUpdate returns the document as it was before the update was applied. Setting the new option to true will make the method return the updated document instead.
            // By default, Mongoose does not run validation on update operations. Setting the runValidators option to true ensures that the update operation respects the schema validation rules you have defined. This means Mongoose will validate the data before applying the update
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};





  //=====change Password====



  export const changePassword = async (req, res) => {

  const { currentPassword, newPassword } = req.body;

  //checking if its blank

  if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
      const user = await User.findById(req.user.id); // Assuming you have user id in the req.user

      // ifpassword matches
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      //salt is used to make the hashing unique 

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      console.log(user, "userData")

      res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};


// =============================Address controlers ==========================


//add Adress

export const addAddress = async (req, res) => {

  try {

    const address = new Address({
      userId: req.user._id,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
    });

    console.log(address, "My addresses")

    await address.save();
    res
      .status(201)
      .json({ success: true, message: "Address added successfully", address });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error adding address", error });
  }
};



