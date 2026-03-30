const Order = require("../../models/Order");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

const normalizeOrderResponse = (orderDoc) => {
  if (!orderDoc) return null;
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  order.status = order.orderStatus;
  order.total = order.totalAmount;
  order.shippingAddress = order.customerAddress || order.shippingAddress || {};
  return order;
};

// Get all orders with pagination and filtering
exports.getAllOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) {
    query.orderStatus = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { customerName: { $regex: req.query.search, $options: "i" } },
      { customerEmail: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("user", "name email")
      .populate("items.productId", "name price images")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ]);

  const updatedOrders = await Promise.all(
    orders.map(async (order) => {
      if (order.orderStatus === "completed" && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        await order.save();
      } else if (
        order.orderStatus === "cancelled" &&
        order.paymentStatus !== "refunded"
      ) {
        order.paymentStatus = "refunded";
        await order.save();
      }
      return normalizeOrderResponse(order);
    }),
  );

  res.json({
    status: "success",
    data: {
      orders: updatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get single order
exports.getOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.productId", "name price images");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.json({
    status: "success",
    data: { order: normalizeOrderResponse(order) },
  });
});

// Update order status
exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = [
    "pending",
    "processing",
    "ready",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "refunded",
  ];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  let paymentStatus = order.paymentStatus;
  if (status === "completed" || status === "delivered") {
    paymentStatus = "paid";
  } else if (status === "cancelled" || status === "refunded") {
    paymentStatus = "refunded";
  }

  order.orderStatus = status;
  order.paymentStatus = paymentStatus;

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status,
    updatedBy: req.user._id,
  });

  await order.save();

  const updatedOrder = await Order.findById(id)
    .populate("user", "name email")
    .populate("items.productId", "name price images");

  res.json({
    status: "success",
    data: { order: normalizeOrderResponse(updatedOrder) },
  });
});

// Process refund
exports.processRefund = catchAsync(async (req, res) => {
  const { amount, reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.orderStatus !== "delivered") {
    throw new AppError("Only delivered orders can be refunded", 400);
  }

  if (Number(amount) > order.totalAmount) {
    throw new AppError("Refund amount cannot exceed order total", 400);
  }

  order.refund = {
    amount,
    reason,
    processedAt: Date.now(),
  };
  order.orderStatus = "refunded";
  order.paymentStatus = "refunded";

  await order.save();

  const updatedOrder = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.productId", "name price images");

  res.json({
    status: "success",
    data: { order: normalizeOrderResponse(updatedOrder) },
  });
});
