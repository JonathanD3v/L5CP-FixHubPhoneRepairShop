const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  // Report Info
  reportType: {
    type: String,
    enum: [
      "daily_sales",
      "weekly_sales",
      "monthly_sales",
      "technician_performance",
      "service_popularity",
      "product_sales",
      "inventory_status",
      "payment_collection",
    ],
    required: true,
  },

  // Date Range
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },

  // Summary Data
  summary: {
    totalRevenue: Number,
    totalRepairRevenue: Number,
    totalProductRevenue: Number,
    totalJobs: Number,
    totalOrders: Number,
    completedJobs: Number,
    pendingJobs: Number,
    averageJobValue: Number,
    averageOrderValue: Number,
    totalPartsCost: Number,
    totalProfit: Number,
    profitMargin: Number,
  },

  // Detailed Data
  data: {
    type: Object,
    required: true,
  },

  // Charts Data
  charts: {
    revenueChart: {
      labels: [String],
      datasets: [
        {
          label: String,
          data: [Number],
        },
      ],
    },
    jobChart: {
      labels: [String],
      datasets: [
        {
          label: String,
          data: [Number],
        },
      ],
    },
    technicianChart: {
      labels: [String],
      datasets: [
        {
          label: String,
          data: [Number],
        },
      ],
    },
    productChart: {
      labels: [String],
      datasets: [
        {
          label: String,
          data: [Number],
        },
      ],
    },
  },

  // Top Items
  topServices: [
    {
      name: String,
      count: Number,
      revenue: Number,
    },
  ],
  topProducts: [
    {
      name: String,
      quantity: Number,
      revenue: Number,
    },
  ],
  topTechnicians: [
    {
      name: String,
      jobsCompleted: Number,
      averageTime: Number,
      revenue: Number,
    },
  ],

  // Export Info
  exportFormat: {
    type: String,
    enum: ["pdf", "excel", "csv"],
    default: null,
  },
  exportedAt: Date,
  exportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Audit
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", reportSchema);
