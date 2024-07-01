import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";


import nodemailer from "nodemailer";


//========================================================================================
//LoadDashboard

export const loadDash= async(req,res)=>{
    try{
        console.log("Iam dashboard")
        res.render('dashboard')
    }catch(error){
        console.error(error)
    }
}

//=====================================================

//customerdash

export const loadCustomerDash= async(req,res)=>{

    try{
        const userDetails = await User.find({isAdmin: false})
    
        res.render('customer',{userDetails})
    }catch(error){
        console.error(error)
    }

}

//==================================================

export const blockUser = async (req,res)=>{

    try {
        const userId= req.query.id
        console.log("block", userId)
        const userData =await User.findByIdAndUpdate(userId,{isActive:false})
        await userData.save()
        res.redirect('/admin/customer')
    }catch (error){
        console.log(error.messgae)
    }
}


export const unblockUser = async (req,res)=>{

    try{
        
        const userId = req.query.id
        console.log(userId)
        const userData = await User.findByIdAndUpdate(userId, {isActive : true})
        await userData.save()

        res.redirect ('/admin/customer')
    }catch (error){
        console.log(error.message)
    }
}

// ===============================================================================

//Logout

export const logout = async (req, res) => {
    try {
      // Clear the JWT cookie
      res.clearCookie('token');
  
      // Redirect to the homepage
      res.redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  };

//=================================================================================== 













