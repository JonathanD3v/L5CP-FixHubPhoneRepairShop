const jwt = require("jsonwebtoken");
require("dotenv").config();

const protect = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")?.[1];

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decryptedTokenDetails = jwt.verify(token, process.env.JWT_KEY);

    req.user = {
      _id: decryptedTokenDetails.userId,
      role: decryptedTokenDetails.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      isSuccess: false,
      message: error.message,
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        isSuccess: false,
        message: "Forbidden: Insufficient permissions",
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
