const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);

// Protected routes (admin only)
router.post("/", protect, restrictTo("admin"), productController.createProduct);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  productController.deleteProduct,
);

module.exports = router;
