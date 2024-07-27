import { Offer } from "../models/OfferModel.js";



export const calculateSalesPrice = async (product) => {
  const now = new Date();

  // Finding active offers for the product
  const productOffers = await Offer.find({
    product: product._id,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });

  // Finding active offers for the category of the product
  const categoryOffers = await Offer.find({
    category: product.category._id,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });

  let discount = 0;

  if (productOffers.length > 0) {
    // Get the highest product-specific discount
    const maxProductDiscount = Math.max(...productOffers.map(offer => offer.discount));

    if (categoryOffers.length > 0) {
      // Check if product belongs to the category with active category offers
      const isProductInCategory = categoryOffers.some(offer => offer.category.equals(product.category._id));
      
      if (isProductInCategory) {
        // Get the highest category-specific discount
        const maxCategoryDiscount = Math.max(...categoryOffers.map(offer => offer.discount));
        
        // Compare and take the highest discount between product and category
        discount = Math.max(maxProductDiscount, maxCategoryDiscount);
      } else {
        discount = maxProductDiscount; // Only apply the product-specific discount
      }
    } else {
      discount = maxProductDiscount; // Only apply the product-specific discount if no category offers
    }
  } else if (categoryOffers.length > 0) {
    // Get the highest category-specific discount if no product-specific offers
    discount = Math.max(...categoryOffers.map(offer => offer.discount));
  }

  if (discount > 0) {
    // Calculate the sales price based on the highest discount
    const salesPrice = product.regularPrice * (1 - discount / 100);
    return salesPrice.toFixed(2); // Return the sales price
  }

  return product.regularPrice.toFixed(2); // Return the regular price if no offers
};