const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get total sales for today and last 30 days
        const [todaySales, monthlySales] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Get total products count
        const totalProducts = await Product.countDocuments();

        // Get top selling products with correct counts
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: 'completed'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    totalRevenue: 1,
                    orderCount: 1,
                    'product.name': 1,
                    'product.price': 1,
                    'product.stock': 1,
                    'product.images': 1
                }
            }
        ]);

        // Get customer statistics
        const customerStats = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Get inventory alerts with total count
        const [lowStockProducts, lowStockCount] = await Promise.all([
            Product.find({ stock: { $lt: 10 } })
                .select('name stock images')
                .limit(5),
            Product.countDocuments({ stock: { $lt: 10 } })
        ]);

        // Get total orders count
        const totalOrders = await Order.countDocuments();

        res.json({
            sales: {
                today: todaySales[0] || { total: 0, count: 0 },
                monthly: monthlySales[0] || { total: 0, count: 0 }
            },
            products: {
                total: totalProducts,
                lowStock: lowStockCount
            },
            orders: {
                total: totalOrders
            },
            topProducts,
            customerStats,
            lowStockProducts
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Error fetching dashboard statistics' });
    }
};

// Get reports
exports.getReports = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        let report;
        switch (type) {
            case 'sales':
                report = await Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: start, $lte: end },
                            status: 'completed'
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' },
                                day: { $dayOfMonth: '$createdAt' }
                            },
                            total: { $sum: '$total' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
                ]);
                break;

            case 'products':
                report = await Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: start, $lte: end },
                            status: 'completed'
                        }
                    },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.product',
                            totalSold: { $sum: '$items.quantity' },
                            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                        }
                    },
                    {
                        $lookup: {
                            from: 'products',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    { $unwind: '$product' },
                    { $sort: { totalSold: -1 } }
                ]);
                break;

            case 'customers':
                report = await Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: start, $lte: end },
                            status: 'completed'
                        }
                    },
                    {
                        $group: {
                            _id: '$customer',
                            totalSpent: { $sum: '$total' },
                            orderCount: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'customer'
                        }
                    },
                    { $unwind: '$customer' },
                    { $sort: { totalSpent: -1 } }
                ]);
                break;

            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(report);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
}; 