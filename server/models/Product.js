const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
  },
  description: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    maxlength: 200,
  },

  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  comparePrice: {
    type: Number,
    min: 0,
    default: null,
  },
  cost: {
    type: Number,
    min: 0,
    default: 0,
  },

  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },
  stockHistory: [
    {
      adjustment: Number,
      reason: String,
      previousStock: Number,
      newStock: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Media
  images: [String],
  mainImage: {
    type: String,
    default: "",
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug from name
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Product", productSchema);
