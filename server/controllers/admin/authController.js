const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_KEY = process.env.JWT_KEY;
// const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, JWT_KEY, {
    expiresIn: "30d",
  });

  // const refreshToken = jwt.sign(
  //     { userId: user._id },
  //     REFRESH_TOKEN_SECRET,
  //     { expiresIn: '30d' }
  // );

  return { accessToken };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and check if admin
    const user = await User.findOne({ email });
    // console.log("user_role", user.role)
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken } = generateTokens(user);

    // Store refresh token in user document
    // user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      // refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin", // Temporarily force admin role
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Error logging out" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in user document
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};
