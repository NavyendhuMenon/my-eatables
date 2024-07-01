import Product from "../models/productModel.js";
import { category } from "../models/categoryModel.js";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import { v4 as uuidv4 } from "uuid"; // uuid for unique file names

//=========================================//Category Management==========================================

//loadCategory
export const loadCategory = async (req, res) => {
  try {
    const categoryDetail = await category.find();
    console.log("categorydetail:", categoryDetail);

    res.render("category", { categoryDetail });
  } catch (error) {
    console.error(error);
  }
};


//loadEditCategory

export const loadEditCategory = async (req, res) => {
  try {
    const catId = req.query.id;
    const categoryDetail = await category.findById({ _id: catId });
    res.render("editCategory", { categoryDetail });
  } catch (error) {
    console.error(error);
  }
};


//edit Categories

export const EditCategory = async (req, res) => {
  console.log("Edit category endpoint hit");

  try {
    const catId = req.query.id;
    console.log("Category ID:", catId);

    // Updatin with new data 
    const { categoryDetailName, categoryDetailDescription } = req.body;
    console.log("new name:", categoryDetailName);
    console.log("new des:", categoryDetailDescription);
    const updatedCategory = await category.findByIdAndUpdate(
      catId,
      { name: categoryDetailName, description: categoryDetailDescription },
      { new: true } // returns updated doc
    );

    console.log("updated Categoryyyyyy:::", updatedCategory);

    if (updatedCategory) {
      console.log("inside updateCat condition");
      res.redirect("/admin/category");

    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};


//block categeory
export const blockCategory = async (req, res) => {
  try {
    const catId = req.query.id;
    console.log("block", catId);
    const catblock = await category.findByIdAndUpdate(catId, {
      isActive: false,
    });

    console.log("blocked cat", catblock);
    await Product.updateMany({ category: catId }, { isActive: false });
    // await catData.save()
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

//unblock category

export const unblockCategory = async (req, res) => {
  try {
    console.log("Im in controler");
    const catId = req.query.id;

    const catUnblock = await category.findByIdAndUpdate(catId, {
      isActive: true,
    });
    await Product.updateMany({ category: catId }, { isActive: true });
    console.log("Im safe");
    // await catData.save()
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

//addCategories

export const addCatagories = async (req, res) => {
  try {
    console.log("Iam in addCategories");
    const { categoryName, categoryDescription } = req.body;
    console.log("body", req.body);

    const categoryExists = await category.findOne({ name: categoryName });
    const exists = !!categoryExists;

    if (exists) {
      console.log("hwello", categoryExists);
      res.status(400).json({ error: "Category already exists" });
      return;
    }

    let Category = new category({
      name: categoryName,
      description: categoryDescription,
    });

    const newCategory = await Category.save();
    console.log(newCategory);

    res.status(201).json(newCategory);
  } catch (error) {
    console.log(error.message);
  }
};

// ===============================Multer Function=================================================================

// Multer storage configuration

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "d:\\Users\\user\\Desktop\\BROTOTYPE\\Eatable\\public\\uploads"); // Using relative path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + uuidv4();
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]
    );
  },
});

// storage configuration
export const upload = multer({ storage: storage });



//crop image
export const cropImages = async (req, res, next) => {
  if (!req.files) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        const inputPath = file.path;
        const outputPath = `./public/uploads/cropped-${file.filename}`;
        console.log(inputPath, outputPath, "on crop");

        console.log("outputPath:", outputPath);

        await sharp(inputPath)
          .resize(500, 500) // Set the desired width and height
          .toFile(outputPath);

        try {
          file.path = outputPath;
          file.filename = `cropped-${file.filename}`;

          console.log("file.filename:", file.filename);
        } catch (unlinkError) {
          console.error(`Error in deleting the file:`, unlinkError);
        }
      })
    );

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image");
  }
};

//============================ Product controller =================================================

//listing the products

export const loadProductList = async (req, res) => {
  try {
    console.log("productlist");
    const productList = await Product.find({});

    console.log("inside productlist", productList);

    res.render("productList", { productList });
  } catch (error) {
    console.error(error);
  }
};

//block Product

export const blockProduct = async (req, res) => {
  try {
    const ProductId = req.query.id
    console.log("block", ProductId)
    await Product.findByIdAndUpdate(ProductId, { isActive: false });
    console.log("producTblock", Product);
    res.redirect("/admin/productlist");
  } catch (error) {
    console.log(error.message);
  }
};

//unblock Product

export const unblockProduct = async (req, res) => {
  try {
    console.log("Im in controler")
    const ProductId = req.query.id
    console.log(ProductId, "MY ID ")
    await Product.findByIdAndUpdate(ProductId, { isActive: true });
    console.log("Im product unblock", Product);
    res.redirect("/admin/productlist");
  } catch (error) {
    console.log(error.message);
  }
};

//on clicking edit, it will load editloadProduct

export const editproductLoad = async (req, res) => {
  try {
    const productId = req.query.id;
    const productDetails = await Product.findById({ _id: productId })
      .populate("category")
      .exec()

    const pCategory = await category.find({});

    res.render("editProduct", { productDetails, pCategory });
  } catch (error) {
    console.log(error.message);
  }
};

// edit Product posting

export const EditProduct = async (req, res) => {
  console.log("Edit Product endpoint hit");

  try {
    const productId = req.query.id;
    console.log("productId", productId);

    // Handle new images
    let arrImages = [];
    for (let i = 0; i < req.files.length; i++) {
      arrImages[i] = req.files[i].filename;
      console.log("filename of the cropped image is ", req.files[i].filename);
    }
    console.log(arrImages, "images");

    // Update with new data
    const { pname, pdescription, regularPrice, pquantity, pcategory } =
      req.body;

    // if a product with the same name exists, excluding the current product
    const existingProduct = await Product.findOne({
      title: pname,
      _id: { $ne: productId },
    });
    if (existingProduct) {
      return res.status(400).send("Product name already exists");
    }

    // Update product data
    const updateData = {
      title: pname.trim(),
      description: pdescription.trim(),
      regularPrice: Math.max(0, regularPrice),
      quantity: Math.max(0, pquantity),
      category: pcategory,
    };

    // If new images are uploaded, include them in the update
    if (arrImages.length > 0) {
      // updateData.images = arrImages;

      const product = await Product.findOne({ _id: productId });
      // product.image.push(arrImages)

      for (let newImage of arrImages) {
        product.image.push(newImage);
      }

      await product.save();
    }

    // Update the product in db
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true } // return the updated doc
    );

    console.log(updatedProduct, "UpdatedProduct");
    res.redirect("/admin/productList");
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

//delete product Image

export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imagePath } = req.query;

    // Find the product first
    const product = await Product.findById(productId);

    console.log("Productid:", product);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // image exists ?
    if (!product.image.includes(imagePath)) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found in the product" });
    }

    // removeimage
    
    product.image = product.image.filter((img) => img !== imagePath);
    await product.save();

    // Remove imagefile
    const imageFileName = imagePath.split("/").pop(); // Extract the file name
    const imageFilePath = `d:/Users/user/Desktop/BROTOTYPE/Eatable/public/uploads/${imageFileName}`;

    fs.unlink(imageFilePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err}`);
        return res
          .status(500)
          .json({ success: false, message: "Error deleting image file" });
      }
      console.log(`File deleted: ${imageFilePath}`);
    });

    res.json({ success: true, message: "Image deleted successfully", product });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// load Add new Product page

export const loadProduct = async (req, res) => {
  try {
    const newcategory = await category.find({ isActive: true });
    res.render("addProduct", { newcategory });
  } catch (error) {
    console.error(error);
  }
};

// posting addNewProduct
export const addNewProduct = async (req, res) => {
  try {
    let arrImages = [];
    for (let i = 0; i < req.files.length; i++) {
      arrImages[i] = req.files[i].filename;
      console.log("filename of the cropped image is ", req.files[i].filename);
    }
    console.log(arrImages, "images");

    console.log("Iam in add new product");

    const {
      pname,
      pdescription,
      regularPrice,
      salesPrice,
      date,
      tags,
      isActive,
      quantity,
      catStatus,
      pcategory,
    } = req.body;

    const product = new Product({
      title: pname,
      description: pdescription,
      regularPrice: regularPrice,
      salesPrice: salesPrice,
      date: date,
      image: arrImages,
      tags: tags,
      category: pcategory,
      isActive: isActive,
      quantity: quantity,
      catStatus: catStatus,
    });

    const productData = await product.save();

    console.log("MyProduct", productData);

    if (productData) {
      // res.json({success:true,message:'Product added successfully '})
      res.redirect("/admin/productlist");
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
  }
};
