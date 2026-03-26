const mongoose = require("mongoose");
const Product = require("../models/Product");

// Helper function to generate unique slug
const generateUniqueSlug = async (name) => {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug exists
  let existingProduct = await Product.findOne({ slug });
  let counter = 1;

  while (existingProduct) {
    slug = `${slug}-${counter}`;
    existingProduct = await Product.findOne({ slug });
    counter++;
  }

  return slug;
};

// Public: Get products (user view)
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search by name or description
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
      ];
    }

    // Filter by stock availability
    if (req.query.inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice)
        filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Filter by featured
    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    // Sorting
    let sort = { createdAt: -1 }; // default: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_asc":
          sort = { price: 1 };
          break;
        case "price_desc":
          sort = { price: -1 };
          break;
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        case "oldest":
          sort = { createdAt: 1 };
          break;
        case "newest":
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
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
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Public: Get product by ID or slug (user view)
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    // Check if id is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({ _id: id, isActive: true })
        .populate("category", "name slug")
        .lean();
    }

    // If not found by ID, try by slug
    if (!product) {
      product = await Product.findOne({ slug: id, isActive: true })
        .populate("category", "name slug")
        .lean();
    }

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Admin: Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Generate unique slug from name if not provided
    if (!productData.slug && productData.name) {
      productData.slug = await generateUniqueSlug(productData.name);
    }

    // Check if slug already exists (double check)
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      return res.status(400).json({
        status: "error",
        message: "Product with this slug already exists",
      });
    }

    const product = await Product.create(productData);

    res.status(201).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({
      status: "error",
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Admin: Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: Date.now() };

    // If name is being updated, generate new slug
    if (updateData.name) {
      updateData.slug = await generateUniqueSlug(updateData.name);
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: "query",
    }).populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      status: "error",
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Admin: Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    product.updatedAt = Date.now();
    await product.save();

    res.status(200).json({
      status: "success",
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Admin: Hard delete (permanent)
exports.permanentDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Product permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting product:", error);
    res.status(500).json({
      status: "error",
      message: "Error permanently deleting product",
      error: error.message,
    });
  }
};

// Admin: Adjust stock
exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (!adjustment || adjustment === 0) {
      return res.status(400).json({
        status: "error",
        message: "Adjustment amount is required and cannot be zero",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const previousStock = product.stock;
    const newStock = previousStock + adjustment;

    if (newStock < 0) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient stock. Cannot reduce below zero.",
      });
    }

    product.stock = newStock;
    product.stockHistory.push({
      adjustment,
      reason: reason || "Manual adjustment",
      previousStock,
      newStock,
      date: new Date(),
    });
    product.updatedAt = Date.now();

    await product.save();

    res.json({
      status: "success",
      data: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        stockHistory: product.stockHistory.slice(-5), // Return last 5
      },
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    res.status(500).json({
      status: "error",
      message: "Error adjusting stock",
      error: error.message,
    });
  }
};

// Admin: Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      stock: {
        $lte: mongoose.Types.Decimal128
          ? "$lowStockThreshold"
          : "$lowStockThreshold",
      },
    })
      .populate("category", "name")
      .sort({ stock: 1 })
      .lean();

    // Manual filter for low stock (since MongoDB can't compare fields directly)
    const lowStockProducts = products.filter(
      (p) => p.stock <= p.lowStockThreshold,
    );

    res.json({
      status: "success",
      data: {
        count: lowStockProducts.length,
        products: lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

// Admin: Get all products (with filters, including inactive)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.isActive === "true") {
      filter.isActive = true;
    } else if (req.query.isActive === "false") {
      filter.isActive = false;
    }

    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
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
  } catch (error) {
    console.error("Error fetching products (admin):", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching products",
      error: error.message,
    });
  }
};
