const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const mongoose = require("mongoose");

const mapOrderDto = (orderDoc) => {
  if (!orderDoc) return null;
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  order.status = order.orderStatus;
  order.total = order.totalAmount;
  order.shippingAddress = order.customerAddress || order.shippingAddress || {};
  order.user = order.user || null;

  if (order.items && Array.isArray(order.items)) {
    order.items = order.items.map((item) => {
      const mapped = {
        _id: item._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productId: item.productId || item.product || null,
      };
      // Normalize product field for frontend compatibility
      if (item.product) mapped.product = item.product;
      if (item.productId && item.productId.name)
        mapped.product = item.productId;

      return mapped;
    });
  }

  return order;
};

exports.createOrder = async (req, res) => {
  try {
    const {
      items = [],
      shippingAddress = {},
      paymentMethod = "cash",
      deliveryMethod = "pickup",
      customerName,
      customerEmail,
      customerPhone,
      discount = 0,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }

    const user = await User.findById(req.user._id).select("name email phone");

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = item.productId || item.product;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid product id in items" });
      }

      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${productId} not found` });
      }

      if (product.stock < quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }

      const unitPrice = Number(item.price) || product.price;
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      product.stock -= quantity;
      product.stockHistory = product.stockHistory || [];
      product.stockHistory.push({
        adjustment: -quantity,
        reason: "order created",
        previousStock: product.stock + quantity,
        newStock: product.stock,
      });
      await product.save();

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        productImage:
          product.mainImage || (product.images && product.images[0]) || "",
        quantity,
        unitPrice,
        totalPrice,
      });
    }

    const tax = Number((subtotal * 0.1).toFixed(2));
    const shippingCost = Number(shippingAddress?.shippingCost || 0);
    const totalAmount = Number(
      (subtotal + tax + shippingCost - Number(discount)).toFixed(2),
    );

    const customerNameValue =
      customerName || shippingAddress.name || user?.name || "";
    const customerEmailValue =
      customerEmail || shippingAddress.email || user?.email || "";
    const customerPhoneValue =
      customerPhone || shippingAddress.phone || user?.phone || "";

    if (!customerNameValue || !customerEmailValue || !customerPhoneValue) {
      return res
        .status(400)
        .json({ error: "Customer name, email, and phone are required" });
    }

    const customerAddr = {
      street: shippingAddress.street || "",
      city: shippingAddress.city || "",
    };

    if (!customerAddr.street || !customerAddr.city) {
      return res
        .status(400)
        .json({ error: "Customer street and city are required" });
    }

    const effectivePaymentMethod =
      paymentMethod === "credit_card" ? "card" : paymentMethod;

    let paymentDetails = {};
    if (effectivePaymentMethod === "card") {
      const { cardHolder, cardNumber, expirationDate, cvv } =
        req.body.paymentDetails || {};
      if (!cardHolder || !cardNumber || !expirationDate || !cvv) {
        return res.status(400).json({
          error:
            "Card payment requires cardHolder, cardNumber, expirationDate, and cvv",
        });
      }

      paymentDetails = {
        cardHolder,
        cardNumber:
          cardNumber
            .toString()
            .slice(-4)
            .padStart(cardNumber.toString().length, "*") || "",
        expirationDate,
      };
    }

    const order = new Order({
      user: req.user._id,
      customerName: customerNameValue,
      customerEmail: customerEmailValue,
      customerPhone: customerPhoneValue,
      customerAddress: customerAddr,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      discount,
      totalAmount,
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: effectivePaymentMethod,
      paymentDetails,
      deliveryMethod,
      createdBy: req.user._id,
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.productId", "name price images");

    const responseOrder = mapOrderDto(populatedOrder);

    return res.status(201).json(responseOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Error creating order" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role !== "admin" && req.user.role !== "staff") {
      query.user = req.user._id;
    }

    if (status) {
      query.orderStatus = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, count] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.productId", "name price images"),
      Order.countDocuments(query),
    ]);

    if (req.user.role === "admin" || req.user.role === "staff") {
      return res.json({
        status: "success",
        data: {
          orders: orders.map(mapOrderDto),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            pages: Math.ceil(count / Number(limit)),
          },
        },
      });
    }

    // keep compatibility for client user orders endpoint
    return res.json(orders.map(mapOrderDto));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Error fetching orders" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    const query = { _id: id };
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate("user", "name email")
      .populate("items.productId", "name price images");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const responseOrder = mapOrderDto(order);

    return res.json(responseOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Error fetching order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "ready",
      "shipped",
      "delivered",
      "cancelled",
      "completed",
      "refunded",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const query = { _id: req.params.id };
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.orderStatus = status;

    if (status === "completed" || status === "delivered") {
      order.paymentStatus = "paid";
    }

    if (status === "cancelled" || status === "refunded") {
      order.paymentStatus = "refunded";
    }

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      updatedBy: req.user._id,
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.productId", "name price images");

    return res.json({
      status: "success",
      data: { order: mapOrderDto(populatedOrder) },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Error updating order status" });
  }
};
