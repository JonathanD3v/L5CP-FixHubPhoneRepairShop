const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);

// Protected routes (admin only)
router.post(
  "/",
  protect,
  restrictTo("admin"),
  categoryController.createCategory,
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  categoryController.updateCategory,
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  categoryController.deleteCategory,
);

module.exports = router;
