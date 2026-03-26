const Product = require('../../models/Product');
const Supplier = require('../../models/Supplier');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get inventory status
exports.getInventory = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
        query.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    if (req.query.lowStock) {
        query.stock = { $lt: 10 };
    }

    const [products, total] = await Promise.all([
        Product.find(query)
            .select('name sku stock price category')
            .populate('category', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ stock: 1 }),
        Product.countDocuments(query)
    ]);

    res.json({
        status: 'success',
        data: {
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Update stock
exports.updateStock = catchAsync(async (req, res) => {
    const { stock } = req.body;
    if (typeof stock !== 'number' || stock < 0) {
        throw new AppError('Invalid stock value', 400);
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { stock },
        { new: true, runValidators: true }
    ).select('name sku stock');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    res.json({
        status: 'success',
        data: { product }
    });
});

// Adjust stock (increment/decrement)
exports.adjustStock = catchAsync(async (req, res) => {
    const { adjustment, reason } = req.body;
    if (typeof adjustment !== 'number') {
        throw new AppError('Invalid adjustment value', 400);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const newStock = product.stock + adjustment;
    if (newStock < 0) {
        throw new AppError('Stock cannot be negative', 400);
    }

    product.stock = newStock;
    product.stockHistory.push({
        adjustment,
        reason,
        previousStock: product.stock - adjustment,
        newStock,
        date: Date.now()
    });

    await product.save();

    res.json({
        status: 'success',
        data: { product }
    });
});

// Get stock history
exports.getStockHistory = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const product = await Product.findById(req.params.id)
        .select('stockHistory')
        .slice('stockHistory', [skip, limit]);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const total = product.stockHistory.length;

    res.json({
        status: 'success',
        data: {
            history: product.stockHistory,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get all suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const suppliers = await Supplier.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ name: 1 });

        const total = await Supplier.countDocuments(query);

        res.json({
            suppliers,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Error fetching suppliers' });
    }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
    try {
        const { name, email, phone, address, products } = req.body;

        const supplier = new Supplier({
            name,
            email,
            phone,
            address,
            products
        });

        await supplier.save();

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Error creating supplier' });
    }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        const { name, email, phone, address, products } = req.body;

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { $set: { name, email, phone, address, products } },
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({
            message: 'Supplier updated successfully',
            supplier
        });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Error updating supplier' });
    }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Error deleting supplier' });
    }
}; 