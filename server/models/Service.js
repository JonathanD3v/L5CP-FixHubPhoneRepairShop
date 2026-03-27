const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Phone", "Laptop", "Tablet", "Computer", "Other"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    estimatedTime: {
      type: Number, // in minutes
      required: true,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: "",
    },
    cost: {
      type: Number,
      min: 0,
      default: 0,
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Service", serviceSchema);
