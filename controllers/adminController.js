import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { Order } from "../models/OrdersModel.js"

import *as salesData from "../helper/salesDataHelper.js"





import nodemailer from "nodemailer";


//========================================================================================
//LoadDashboard has chart and sales report

export const loadDash = async (req, res) => {
    try {
        // Fetch overall statistics
        const totalOrders = await Order.countDocuments();
        const totalOrderAmount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);
        const totalDiscount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalDiscount: { $sum: '$discountApplied' }
                }
            }
        ]);

        const overallRevenue = await Order.aggregate([
            {
                $match: { orderStatus: 'Delivered' }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Prepare data to send to the view
        const stats = {
            overallSalesCount: totalOrders,
            overallOrderAmount: totalOrderAmount[0] ? totalOrderAmount[0].totalAmount : 0,
            overallDiscount: totalDiscount[0] ? totalDiscount[0].totalDiscount : 0,
            overallRevenue: overallRevenue[0] ? overallRevenue[0].totalRevenue : 0
        };

        // Render the dashboard view with statistics
        res.render('dashboard', { stats });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('An error occurred while loading the dashboard');
    }
}

//get graph data

export const getStatsData = async (req, res) => {

    console.log("Iam in get StatsData:::::::::::")
    try {
        const { filter, startDate, endDate } = req.query;
        let data = {};

        if (filter === undefined) {
            return res.status(400).json({ error: 'Filter is required' });
        }

        if (filter === 'daily') {
            data = await salesData.getDailySales();
            console.log("Daily", data);
        } else if (filter === 'weekly') {
            data = await salesData.getWeeklySales();
            console.log("Weekly", data);
        } else if (filter === 'monthly') {
            data = await salesData.getMonthlySales();
            console.log("Monthly", data);
        } else if (filter === 'yearly') {
            data = await salesData.getYearlySales();
            console.log("Yearly", data);
        } else if (filter === 'custom') {
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required for custom filter' });
            }
            data = await salesData.getCustomSales(startDate, endDate);
        } else {
            return res.status(400).json({ error: 'Invalid filter type' });
        }
        

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};



//sales report 

export const getSalesReport = async (req, res) => {
    const { dateFrom, dateTill } = req.query;

    if (!dateFrom || !dateTill) {
        return res.status(400).json({ message: 'Date range is required' });
    }

    try {
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTill)
            }
        })
        .populate('deliveryAddress', 'name') // Assuming 'name' is a field in the Address model
        .populate('coupon'); // Populate the coupon field

        const totalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const totalSales = orders.length;

        // Calculate total coupon discount
        const totalCouponDiscount = orders.reduce((acc, order) => {
            const discount = order.coupon ? order.coupon.discount : 0;
            return acc + (order.totalAmount * discount / 100);
        }, 0);

        const totalPayment = totalAmount - totalCouponDiscount;

        res.json({
            orders,
            transactionDetails: {
                totalAmount,
                totalSales,
                totalCouponDiscount,
                totalPayment
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};





//===============================================================================

//customerdash

export const loadCustomerDash= async(req,res)=>{

    try{
        const userDetails = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
    
        res.render('customer',{userDetails})
    }catch(error){
        console.error(error)
    }

}

// Block User
export const blockUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.isActive = false;
      await user.save();
  
      res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to block user', error });
    }
  };
  
  // Unblock User
  export const unblockUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.isActive = true;
      await user.save();
  
      res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unblock user', error });
    }
  };

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













