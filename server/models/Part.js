const mongoose = require("mongoose");

const partSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: [true, "Part name is required"],
    trim: true,
  },
  partCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Screen",
      "Battery",
      "Camera",
      "Charging Port",
      "Speaker",
      "Button",
      "Other",
    ],
  },

  description: String,

  compatibleModels: [String], // e.g., ["iPhone 13", "iPhone 13 Pro"]

  // Pricing
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  // Inventory
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minStock: {
    type: Number,
    default: 5,
  },

  // Supplier
  supplier: {
    type: String,
    default: "",
  },
  supplierContact: String,

  // Status
  isActive: {
    type: Boolean,
    default: true,
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

partSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Part", partSchema);
