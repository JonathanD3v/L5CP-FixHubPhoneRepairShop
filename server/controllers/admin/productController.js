const Product = require("../../models/Product");
const Category = require("../../models/Category");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Get all products with pagination and filtering
exports.getAllProducts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.category) {
    query.category = req.query.category;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Product.countDocuments(query),
  ]);

  res.json({
    status: "success",
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get single product
exports.getProduct = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "category",
    "name",
  );
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  res.json({
    status: "success",
    data: { product },
  });
});

// Create new product
exports.createProduct = catchAsync(async (req, res) => {
  // Handle image paths
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => `/uploads/${file.filename}`);
  } else if (req.body.images) {
    // Handle case where images are sent as base64 or URLs
    images = Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images];
  }

  const productData = {
    ...req.body,
    images,
  };

  const product = await Product.create(productData);
  res.status(201).json({
    status: "success",
    data: { product },
  });
});

// Update product
exports.updateProduct = catchAsync(async (req, res) => {
  // Get existing product to check current images
  const existingProduct = await Product.findById(req.params.id);
  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  // Handle image paths
  let images = existingProduct.images || [];

  // Add new uploaded images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => `/uploads/${file.filename}`);
    images = [...images, ...newImages];
  }

  // If images were provided in the request body, use those instead
  if (req.body.images) {
    const imageArray = Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images];
    images = imageArray;
  }

  const productData = {
    ...req.body,
    images,
  };

  const product = await Product.findByIdAndUpdate(req.params.id, productData, {
    new: true,
    runValidators: true,
  }).populate("category", "name");

  res.json({
    status: "success",
    data: { product },
  });
});

// Delete product
exports.deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Bulk product actions
exports.bulkProductAction = catchAsync(async (req, res) => {
  const { action, products } = req.body;

  switch (action) {
    case "delete":
      await Product.deleteMany({ _id: { $in: products } });
      break;
    case "update":
      const { updates } = req.body;
      await Product.updateMany({ _id: { $in: products } }, { $set: updates });
      break;
    default:
      throw new AppError("Invalid action", 400);
  }

  res.json({
    status: "success",
    message: "Bulk action completed successfully",
  });
});

// Get all categories
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort("name");
  res.json({
    status: "success",
    data: { categories },
  });
});

// Create new category
exports.createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: { category },
  });
});

// Update category
exports.updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    status: "success",
    data: { category },
  });
});

// Delete category
exports.deleteCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Update products that were using this category
  await Product.updateMany(
    { category: category._id },
    { $unset: { category: 1 } },
  );

  await category.deleteOne();
  res.status(204).json({
    status: "success",
    data: null,
  });
});
