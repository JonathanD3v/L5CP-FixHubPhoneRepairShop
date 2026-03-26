const Order = require('../../models/Order');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all orders with pagination and filtering
exports.getAllOrders = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
        query.status = req.query.status;
    }
    if (req.query.search) {
        query.$or = [
            { 'shippingAddress.name': { $regex: req.query.search, $options: 'i' } },
            { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } }
        ];
    }

    const [orders, total] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name price images')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Order.countDocuments(query)
    ]);

    // Update payment status for completed and cancelled orders
    const updatedOrders = await Promise.all(orders.map(async (order) => {
        if (order.status === 'completed' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            await order.save();
        } else if (order.status === 'cancelled' && order.paymentStatus !== 'refunded') {
            order.paymentStatus = 'refunded';
            await order.save();
        }
        return order;
    }));

    res.json({
        status: 'success',
        data: {
            orders: updatedOrders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get single order
exports.getOrder = catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.product', 'name price images');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    res.json({
        status: 'success',
        data: { order }
    });
});

// Update order status
exports.updateOrderStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid order status', 400);
    }

    // Find the order first
    const order = await Order.findById(id);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Update status and payment status based on the new status
    let paymentStatus = order.paymentStatus;
    if (status === 'completed') {
        paymentStatus = 'paid';
    } else if (status === 'cancelled') {
        paymentStatus = 'refunded';
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { 
            status,
            paymentStatus,
            ...(status === 'cancelled' && {
                refund: {
                    amount: order.total,
                    reason: 'Order cancelled',
                    processedAt: Date.now()
                }
            })
        },
        { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
        status: 'success',
        data: { order: updatedOrder }
    });
});

// Process refund
exports.processRefund = catchAsync(async (req, res) => {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (order.status !== 'delivered') {
        throw new AppError('Only delivered orders can be refunded', 400);
    }

    if (amount > order.total) {
        throw new AppError('Refund amount cannot exceed order total', 400);
    }

    order.refund = {
        amount,
        reason,
        processedAt: Date.now()
    };
    order.status = 'refunded';
    order.paymentStatus = 'refunded';

    await order.save();

    res.json({
        status: 'success',
        data: { order }
    });
}); 