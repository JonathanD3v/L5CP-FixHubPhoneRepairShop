const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, restrictTo } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, GIF and WebP are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

// Public routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);

// Protected routes (admin only)
router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.array("images", 10),
  productController.createProduct,
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  upload.array("images", 10),
  productController.updateProduct,
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  productController.deleteProduct,
);

module.exports = router;
