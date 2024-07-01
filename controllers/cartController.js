import { User } from "../models/userModel.js";
import Product from "../models/productModel.js";
import { Cart } from "../models/cartModel.js";

//========================wishlist=======================================



//loadWishlist

export const loadwishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(userId, "userId");

    const user = await User.findById(userId).populate("wishlist");
    res.render("wishlist", { wishlist: user.wishlist });
  } catch (error) {
    console.log(error.message);
  }
};



//addtowishlist

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(userId, "addtowishlist userid ");

    const productId = req.params.id;

    console.log(productId, "addtowishlist productid ");

    const user = await User.findById(userId);
    console.log("addtowishlisr:", user);

    console.log(user, "wishlist user");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //if productid already in the wishlist
    if (!user.wishlist.includes(productId)) {
      //if not push and save
      user.wishlist.push(productId);
      await user.save();

      res.status(200).json({ message: "Product added to wishlist" });
    } else {
      res.status(400).json({ message: "Product already in wishlist" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// removing from wishlist

export const removeFromWishlist = async (req, res) => {
 
  try {
    const userId = req.user.id;

    console.log("removefromwishlist userId", userId);

    const productId = req.params.id;

    console.log("removefromwishlist productId", productId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalWishlistLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    const newWishlistLength = user.wishlist.length;

    if (originalWishlistLength === newWishlistLength) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await user.save();
    
    res.status(200).json({ message: "Product removed from wishlist" });
 
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//===========================================Cart==========================================================



//loadCart

export const loadCart = async (req, res) => {
 
  try {

    const userId = req.user.id;
    const myCart = await Cart.findOne({ userId }).populate("product.productId");

    if (!myCart) {
      return res.render("cart", { myCart: { product: [] } });
    }

    console.log("Cart:", myCart);

    res.render("cart", { myCart });
  } catch (error) {
    console.log(error.message);
  }

};



//addtoCart

export const addToCart = async (req, res) => {
  console.log("Hit on add to cart endpoint");

  try {

    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const productData = await Product.findById({ _id: productId });

    console.log("productData", productData);

    if (quantity <= productData.quantity) {
      let userCart = await Cart.findOne({ userId });

      if (!userCart) {
        userCart = new Cart({ userId: userId, products: [] });
      }

      const existingProduct = userCart.product.find(
        (product) => product.productId.toString() === productId.toString()
      );

      console.log("existing product", existingProduct);

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        userCart.product.push({ productId, quantity });
      }

      await userCart.save();

      console.log("UserCart", userCart);

      res
        .status(201)
        .json({ success: true, message: "Item added to cart successfully" });
    } else {
      console.log("OUT OF STOCK");
      res.status(200).json({ success: false, message: "Out of stock" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


// delete from cart 


export const deleteFromCart = async (req,res)=>{

try{

  const userId= req.user.id 
  console.log("on remove from cart with userid", userId)

  const {productId} = req.body

  console.log("cart product id :", productId)

 const userCart = await Cart.findOne({ userId })

 console.log("userCart", userCart)

 if(!userCart){
  return res.status(400).json({ success: false, message: "Cart not found" });
 }

 if (!userCart.product || userCart.product.length === 0) {
  return res.status(404).json({ success: false, message: "Product not found in cart" });
}

// converting both values to strings ensures that the comparison is consistent and correct.
const productIndex = userCart.product.findIndex(
  (product) => product.productId._id.toString() === productId.toString()
);

if (productIndex > -1) {
  userCart.product.splice(productIndex, 1); // Remove the product 
  await userCart.save(); // Save changes to database
  console.log("Updated UserCart:", userCart);
  return res.status(200).json({ success: true, message: "Item removed from cart successfully" });
} else {
  return res.status(404).json({ success: false, message: "Product not found in cart" });
}
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
 
   
};



//increment and decrement cart 

export const incrementQuantity = async (req,res)=>{
  
  try {
        
    console.log("iam on incriment controller")

    const { productId, action  }= req.body
    const userId = req.user.id;

    console.log("Incriment product id :",userId ,"and", productId )

    const userCart = await Cart.findOne({ userId })

    if(!userCart){

      return res.status(400).json({ success: false, message: "Cart not found" })

    }

    const product = userCart. product. find ((item)=> item.productId.toString()===productId.toString());

    if (!product){

      return res.status(404).json({ success: false, message: "Product not found in cart" });

    }

 

      const productData = await Product.findById(productId)

      if (!productData) {
        return res.status(404).json({ success: false, message: "Product not found in inventory" });
      }

    if (action === 'increment') {

      if (product.quantity < productData.quantity) {

        //product.quantity is the product in the user's cart
        // productData.quantity  is the total available quantity of the product in the store or inventory
       
        product.quantity += 1;

        await userCart.save();

        return res.status(200).json({ success: true, message: "Quantity incremented successfully", newQuantity: product.quantity });
      } else {
        return res.status(400).json({ success: false, message: "Out of stock" });
      }

    }else if (action === 'decrement') {
      
      if (product.quantity >1){

        product.quantity -=1
  
        await userCart.save()
  
        return res.status(200).json({ success: true, message: "Quantity decremented successfully", newQuantity: product.quantity });
      }else {
          return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
      }
    }else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
  

    // }else {
    //   return res.status(404).json({ success: false, message: "Product not found in cart" });
    // }

  }catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }

};



//decrement cart 


// export const decrementCart = async (req,res)=>{

//   console.log('Iam on decrenent controller')

//  try{

//   const {productId} = req.body
//   const userId = req.user.id;

//   const userCart = await Cart.findOne({userId})

//   if(!userCart){
//     return res.status(400).json({ success: false, message: "Cart not found" });
//   }

//    //checking if the product already exists in the cart

//   const product = userCart.product.find(
//     (item) => item.productId.toString() === productId.toString()
//   );


//   if (product){
//     if (product.quantity >1){

//       product.quantity -=1

//       await userCart.save()

//       return res.status(200).json({ success: true, message: "Quantity decremented successfully", newQuantity: product.quantity });
//     }else {
//         return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
//     }
//   }else {
//     return res.status(404).json({ success: false, message: "Product not found in cart" });
//   }

//  }catch (error) {
//     console.log(error.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//  }


// }




