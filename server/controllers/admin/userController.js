const User = require('../../models/User');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all users with pagination and filtering
exports.getAllUsers = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
        query.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    if (req.query.role) {
        query.role = req.query.role;
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        User.countDocuments(query)
    ]);

    res.json({
        status: 'success',
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get single user
exports.getUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        throw new AppError('User not found', 404);
    }
    res.json({
        status: 'success',
        data: { user }
    });
});

// Create new user
exports.createUser = catchAsync(async (req, res) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || 'user'
    });

    user.password = undefined;
    res.status(201).json({
        status: 'success',
        data: { user }
    });
});

// Update user
exports.updateUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const allowedFields = ['name', 'email', 'role'];
    const filteredBody = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredBody[key] = req.body[key];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true }
    ).select('-password');

    res.json({
        status: 'success',
        data: { user: updatedUser }
    });
});

// Delete user
exports.deleteUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    await user.deleteOne();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Get available roles
exports.getRoles = catchAsync(async (req, res) => {
    const roles = ['admin', 'manager', 'user'];
    res.json({
        status: 'success',
        data: { roles }
    });
}); 