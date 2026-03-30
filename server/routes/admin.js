const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const authController = require("../controllers/authController");
const userController = require("../controllers/admin/userController");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const customerController = require("../controllers/admin/customerController");
const inventoryController = require("../controllers/admin/inventoryController");
const dashboardController = require("../controllers/admin/dashboardController");
const serviceController = require("../controllers/admin/serviceController");
const mediaController = require("../controllers/admin/mediaController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Auth routes (public)
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh-token", authController.refreshToken);

// Protect admin routes beyond auth
router.use(protect);
router.use(restrictTo("admin", "staff", "technician"));

// User management routes
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUser);
router.post("/users", userController.createUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.get("/roles", userController.getRoles);

// Product management routes
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProduct);

// Use multer middleware for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Separate multer configuration for services
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/services");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "service-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const serviceUpload = multer({
  storage: serviceStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post(
  "/products",
  upload.array("images", 5),
  productController.createProduct,
);
router.put(
  "/products/:id",
  upload.array("images", 5),
  productController.updateProduct,
);
router.delete("/products/:id", productController.deleteProduct);

router.post("/products/bulk", productController.bulkProductAction);
router.get("/categories", productController.getAllCategories);
router.post("/categories", productController.createCategory);
router.put("/categories/:id", productController.updateCategory);
router.delete("/categories/:id", productController.deleteCategory);

// Order management routes
router.get("/orders", orderController.getAllOrders);
router.get("/orders/:id", orderController.getOrder);
router.put("/orders/:id/status", orderController.updateOrderStatus);
router.post("/orders/:id/refund", orderController.processRefund);

// Customer management routes
router.get("/customers", customerController.getAllCustomers);
router.get("/customers/:id", customerController.getCustomer);
router.put("/customers/:id", customerController.updateCustomer);
router.get("/customers/:id/orders", customerController.getCustomerOrders);

// Inventory & Supplier routes
router.get("/inventory", inventoryController.getInventory);
router.put("/inventory/:id", inventoryController.updateStock);
router.post("/inventory/adjust", inventoryController.adjustStock);
router.get("/inventory/history/:id", inventoryController.getStockHistory);
router
  .route("/suppliers")
  .get(inventoryController.getSuppliers)
  .post(inventoryController.createSupplier);
router
  .route("/suppliers/:id")
  .put(inventoryController.updateSupplier)
  .delete(inventoryController.deleteSupplier);

// Dashboard & Reports routes
router.get("/dashboard/stats", dashboardController.getDashboardStats);
router.get("/dashboard/reports", dashboardController.getReports);

// Service management routes
router.get("/services", serviceController.getAllServices);
router.get("/services/:id", serviceController.getService);
router.post(
  "/services",
  serviceUpload.single("image"),
  serviceController.createService,
);
router.put(
  "/services/:id",
  serviceUpload.single("image"),
  serviceController.updateService,
);
router.delete("/services/:id", serviceController.deleteService);
router.patch("/services/:id/toggle", serviceController.toggleServiceStatus);
router.get("/services/categories/list", serviceController.getServiceCategories);

// Media upload route
router.post("/media/upload", mediaController.uploadMedia);
router.delete("/media/:id", mediaController.deleteMedia);
router.get("/media", mediaController.getAllMedia);

module.exports = router;
