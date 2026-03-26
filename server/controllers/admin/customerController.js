const User = require("../../models/User");
const Order = require("../../models/Order");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Get all customers with pagination and filtering
exports.getAllCustomers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { role: "user" };
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [customers, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  res.json({
    status: "success",
    data: {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get single customer
exports.getCustomer = catchAsync(async (req, res) => {
  const customer = await User.findOne({
    _id: req.params.id,
    role: "user",
  }).select("-password");

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  res.json({
    status: "success",
    data: { customer },
  });
});

// Update customer
exports.updateCustomer = catchAsync(async (req, res) => {
  const allowedFields = ["name", "email", "phone", "address"];
  const filteredBody = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "user" },
    filteredBody,
    { new: true, runValidators: true },
  ).select("-password");

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  res.json({
    status: "success",
    data: { customer },
  });
});

// Get customer orders
exports.getCustomerOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.params.id })
      .populate("items.product", "name price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments({ user: req.params.id }),
  ]);

  res.json({
    status: "success",
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});
