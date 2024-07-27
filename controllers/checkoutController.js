import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import Product from "../models/productModel.js";
import { Address } from "../models/addressModel.js";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/OrdersModel.js";
import { Wallet } from "../models/walletModel.js";
import { Coupon } from "../models/CouponModel.js";



import Razorpay  from "razorpay";
import crypto from "crypto";





//load checkoutpage


export const loadCheckout = async (req, res) => {
    try {
        const userId = req.user._id; 

        const cart = await Cart.findOne({ userId }).populate('product.productId');

        if (!cart || cart.product.length === 0) {
            return res.render('404Error'); // Render with empty cart
        }

        //  individual product total
        let subtotal = 0;
        cart.product.forEach(item => {
            item.total = item.productId.regularPrice * item.quantity
            subtotal += item.total; 
        });

        console.log("SubTotal", subtotal)

       
        const deliveryCharges = subtotal > 400 ? 0 : 45
        let discount = 0
        let discountMessage = ""

        const { couponCode } = req.query;

        if (couponCode) {
            // Finding the coupon and validate it
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

            if (coupon) {
                if (coupon.expirationDate > new Date()) {
                    // Calculate the discount
                    discount = parseFloat((subtotal * (coupon.discount / 100)).toFixed(2));
                    discountMessage = `Coupon applied successfully. You saved ₹${discount}!`;
                } else {
                    discountMessage = "Coupon code has expired";
                }
            } else {
                discountMessage = "Invalid or expired coupon code";
            }
        }

        // Calculate the grand total
        const grandTotal = subtotal + deliveryCharges - discount;

        console.log("Grandtotal", grandTotal)

        const userAddress = await Address.find({ userId, isDeleted: false });
        
        res.render('checkout', { 
            cartItems: cart.product, 
            subtotal, 
            deliveryCharges, 
            discount, 
            grandTotal,
            userAddress,
            discountMessage,
            couponCode
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



//PLACE ORDER 

export const placeOrder = async (req, res) => {

    try {

        console.log("iam in place order controller:::::::::::")

        const userId = req.user._id;
        const { addressId, couponCode, paymentMethod, discount } = req.body;

        console.log("Discount", discount)

        const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }


       
        const cart = await Cart.findOne({ userId }).populate('product.productId');
        
        if (!cart || cart.product.length === 0) {
            return res.render('404Error');
        }

        // total amount
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.productId.regularPrice * item.quantity;
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
       
        const totalAmount = subtotal + deliveryCharges - discount;

        // CREATE new order
        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod: 'Cash On Delivery', 
            orderStatus: 'Pending',
            couponCode: couponCode || '', 
            discountApplied: discount 
        });

        await newOrder.save();

        // product quantity in stock reduce
        for (const item of cart.product) {
            const product = item.productId;
            product.quantity -= item.quantity;

            await product.save();
        }

        // cleARing user cart after order is placed 
        await Cart.deleteOne({ userId });

        res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



//Order placed Successfulll


export const loadOrderSuccess = async (req, res) => {

    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate('deliveryAddress').populate({
            path: 'products.productId',
            model: 'Product'
        })


        console.log("iam in LoadOrderSuccesss:::::", order)
        
        

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
       
        let subtotal = 0;
        order.products.forEach(product => {
            subtotal += product.quantity * product.productId.regularPrice;
        });

    
        const deliveryCharges = subtotal > 400 ? 0 : 45;

        
        const discount = order.discountApplied || 0;

        
        const totalAmount = subtotal + deliveryCharges - discount;

        // Render orderPlaced.ejs with order details and calculated amounts
        res.render('orderPlaced', {
            order,
            subtotal: subtotal.toFixed(2),
            deliveryCharges: deliveryCharges.toFixed(2),
            discount: discount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        });
    } catch (err) {
        console.error('Error retrieving order:', err);
        res.status(500).json({ message: 'Server Error' });
    }

};



//===========================Online Payment ====================================//


//instance created 

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// Place order using Razorpay
export const razorpayPlaceOrder = async (req, res) => {

    console.log(" Im in razorpay place order:::::::::::::::::::")

    try {
        const userId = req.user._id;
        const { addressId,couponCode, paymentMethod, discount } = req.body;

        const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }

        const cart = await Cart.findOne({ userId }).populate('product.productId');
        if (!cart || cart.product.length === 0) {
            return res.render('404Error'); // Handle no cart scenario as needed
        }

        // Calculate subtotal and total amount
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.productId.regularPrice * item.quantity;
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
        // const discount = 0;
        const totalAmount = subtotal + deliveryCharges - discount;

        // Create a Razorpay order
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        console.log("Razzopay options",options) 

        const order = await razorpay.orders.create(options);

        console.log("Razzopay order",order)

        // Save initial order details in the database
        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod,
            orderStatus: 'Pending',
            razorpayOrderId: order.id ,
            couponCode: couponCode || '', 
            discountApplied: discount 
        });

        await newOrder.save();

        // Return Razorpay order details to the client
        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id,
            razorpayOrderId: order.id,
            amount: totalAmount * 100,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
            paymentMethod 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// controller to  update order status to failed

export const updateFailedOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'Failed';
        order.failureReason = reason;
        await order.save();

        res.json({ success: true, message: 'Order status updated to failed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



// razorpay verify payment

export const verifyPayment = async (req, res) => {
    
    console.log("Im in verify payment")

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const shasum = crypto.createHmac('sha256', key_secret);

    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentStatus === 'Paid') {
            return res.json({ success: true, message: 'Payment already verified' });
        }

        order.paymentStatus = 'Paid';
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        // Reduce stock quantity
        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();
            }
        }

        // Clear the user's cart
        await Cart.deleteOne({ userId: order.userId });

        res.json({ success: true, message: 'Payment verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
};




//-------------------Wallet Payment -----------------------------------------------------------

export const walletOrder = async (req, res) => {
    try {
        console.log("I am in wallet order controller:::::::::::");

        const userId = req.user.id;
        const { addressId,couponCode, paymentMethod, discount } = req.body;

        // Check for recent orders to prevent duplicate orders
        const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }

        // Fetch the user's cart
        const cart = await Cart.findOne({ userId }).populate('product.productId');

        if (!cart || cart.product.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate the total amount
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.productId.regularPrice * item.quantity;
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
        // const discount = 0;
        const totalAmount = subtotal + deliveryCharges - discount;

        // Ensure the payment method is 'Wallet'
        if (paymentMethod !== 'Wallet') {
            return res.status(400).json({ success: false, message: 'Invalid payment method for this route' });
        }

        // Fetch the user's wallet
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(400).json({ success: false, message: 'Wallet not found' });
        }

        // Check if the wallet has sufficient balance
        if (wallet.balance < totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance',
                currentBalance: wallet.balance.toFixed(2)
            });
        }

        // Create a new order
        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod: 'Wallet', // Payment method is set to Wallet
            orderStatus: 'Pending',
            paymentStatus: 'Paid',
            couponCode: couponCode || '', 
            discountApplied: discount 
        });

        // Deduct the amount from the user's wallet and log the transaction
        wallet.balance -= totalAmount;
        wallet.transactions.push({
            type: 'Debit',
            amount: totalAmount,
            remarks: `Payment for order ${newOrder._id}`
        });

        await wallet.save();
        await newOrder.save();

        // Reduce the quantity in stock for each product
        for (const item of cart.product) {
            const product = item.productId;
            product.quantity -= item.quantity;
            await product.save();
        }

        // Clear the user's cart after the order is placed
        await Cart.deleteOne({ userId });

        res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error('Error placing order with wallet:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
