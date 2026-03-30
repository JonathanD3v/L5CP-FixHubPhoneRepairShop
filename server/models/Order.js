const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Order Number (auto-generated)
  orderNumber: {
    type: String,
    unique: true,
  },

  // User relation (for populate, roles and audit)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Customer Info
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  customerAddress: {
    street: String,
    city: String,
  },

  // Order Items
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: String,
      productImage: String,
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
    },
  ],

  // Pricing
  subtotal: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  couponCode: String,
  totalAmount: {
    type: Number,
    required: true,
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "ready", "delivered", "cancelled"],
    default: "pending",
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card"],
    default: null,
  },
  paymentDetails: {
    cardHolder: String,
    cardNumber: String,
    expirationDate: String,
    cvv: String,
  },
  paymentDate: Date,
  paymentReference: String,

  // Shipping/Delivery
  deliveryMethod: {
    type: String,
    enum: ["pickup", "delivery"],
    default: "pickup",
  },

  // Notifications (for Nodemailer)
  notificationSent: {
    confirmed: { type: Boolean, default: false },
    ready: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
  },

  // Customer Notes
  customerNotes: String,
  staffNotes: String,

  // Status History
  statusHistory: [
    {
      status: String,
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate item totals before saving
orderSchema.pre("save", function (next) {
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  next();
});

module.exports = mongoose.model("Order", orderSchema);
