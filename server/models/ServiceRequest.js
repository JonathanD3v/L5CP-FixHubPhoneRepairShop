const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
  // Request Number (auto-generated)
  requestNumber: {
    type: String,
    unique: true,
  },

  // Customer Info (no separate customer model)
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  customerAddress: String,

  // Device Info
  deviceType: {
    type: String,
    required: true,
    enum: ["Phone", "Laptop", "Tablet", "Computer", "Other"],
  },
  deviceBrand: String,
  deviceModel: String,
  deviceColor: String,
  serialNumber: String,
  imei: String,
  passcode: String, // secured field
  password: String, // secured field

  // Issue Details
  issueDescription: {
    type: String,
    required: true,
  },
  customerNotes: String,
  technicianNotes: String,
  internalNotes: String,

  // Images
  images: [String],

  // Service Info
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
  },
  serviceName: String,
  servicePrice: Number,
  estimatedTime: Number, // in minutes from service model

  // Financial (parts will be in RepairPart model)
  partsCost: {
    type: Number,
    default: 0,
  },
  laborCost: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountReason: String,
  tax: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },

  // Status Workflow
  status: {
    type: String,
    enum: [
      "pending", // Waiting assignment
      "assigned", // Technician assigned
      "diagnosing", // Checking issue
      "in-progress", // Working on it
      "waiting-approval", // Waiting customer approval
      "waiting-parts", // Waiting for parts
      "completed", // Repair done
      "delivered", // Customer picked up
      "cancelled", // Cancelled
    ],
    default: "pending",
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  assignedDate: Date,

  // Time Tracking
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  startedAt: Date,
  completedAt: Date,
  deliveredAt: Date,

  estimatedCompletionDate: Date,
  actualCompletionDate: Date,
  actualMinutes: Number,
  timeDifference: Number, // negative = early, positive = late
  isOnTime: Boolean,

  // Payment
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "bank"],
    default: null,
  },
  paymentDate: Date,
  paidAmount: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
    default: 0,
  },

  // Invoice
  invoiceNumber: String,
  invoiceGenerated: {
    type: Boolean,
    default: false,
  },

  // Notifications (for Nodemailer)
  notificationSent: {
    assigned: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    ready: { type: Boolean, default: false },
    reminder: { type: Boolean, default: false },
  },

  // Feedback
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  customerFeedback: String,

  // Warranty
  warrantyUntil: Date,
  isUnderWarranty: {
    type: Boolean,
    default: false,
  },

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

// Generate request number before saving
serviceRequestSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("ServiceRequest").countDocuments();
    this.requestNumber = `SR-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // Calculate total amount
  this.totalAmount =
    (this.laborCost || 0) + (this.partsCost || 0) - (this.discount || 0);

  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - (this.paidAmount || 0);

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
