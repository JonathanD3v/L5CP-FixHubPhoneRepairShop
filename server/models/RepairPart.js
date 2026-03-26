const mongoose = require("mongoose");

const repairPartSchema = new mongoose.Schema({
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceRequest",
    required: true,
  },
  partId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part",
    required: true,
  },

  partName: {
    type: String,
    required: true,
  },
  partCode: {
    type: String,
    required: true,
  },

  // Usage Details
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number, // selling price at time of use
    required: true,
  },
  costPrice: {
    type: Number, // cost price at time of use
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },

  // Notes
  notes: String,

  // Audit
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate totals before saving
repairPartSchema.pre("save", function (next) {
  this.totalPrice = this.quantity * this.unitPrice;
  this.totalCost = this.quantity * this.costPrice;
  next();
});

module.exports = mongoose.model("RepairPart", repairPartSchema);
