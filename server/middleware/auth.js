const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_KEY = process.env.JWT_KEY;

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // console.log('No token provided');
            return res.status(401).json({ error: 'Not authorized' });
        }

        try {
            const decoded = jwt.verify(token, JWT_KEY);
            // console.log('Decoded token:', decoded);
            
            const user = await User.findById(decoded.userId).select('-password');
            // console.log('Found user:', user?._id);

            if (!user) {
                // console.log('User not found');
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Not authorized' });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized for this action' });
        }
        next();
    };
};
