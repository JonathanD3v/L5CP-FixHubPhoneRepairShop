const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        
        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ error: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
            }
            subtotal += product.price * item.quantity;
            
            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }

        // const shippingCost = 10; // Example fixed shipping cost
        const tax = subtotal * 0.1; // Example 10% tax
        const total = subtotal  + tax;

        const order = new Order({
            user: req.user._id,
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            // shippingCost,
            tax,
            total
        });

        await order.save();
        
        // Populate the product details before sending response
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name price images');

        // Send the order directly without wrapping in status and data
        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error creating order' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = { user: req.user._id };
        
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('items.product', 'name price images');

        const count = await Order.countDocuments(query);

        // Send orders directly without wrapping in status and data
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching orders' });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log("order id",id)
        
        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // console.log('Invalid order ID format:', id);
            return res.status(400).json({ error: 'Invalid order ID format' });
        }

        // console.log('Getting order with ID:', id);
        // console.log('User ID:', req.user._id);

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        }).populate('items.product', 'name price images');

        // console.log('Found order:', order);

        if (!order) {
            // console.log('Order not found');
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error in getOrder:', error);
        res.status(500).json({ error: 'Error fetching order' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { orderStatus: status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            status: 'success',
            data: order
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating order status' });
    }
};
