const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { protect, restrictTo } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for service image uploads
const storage = multer.diskStorage({
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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// 🔓 Public routes (for users)
router.get("/", serviceController.getServices); // Get all services
router.get("/:id", serviceController.getServiceById); // Get single service

// 🔒 Protected routes (admin only)
router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.single("image"),
  serviceController.createService,
);

router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  upload.single("image"),
  serviceController.updateService,
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  serviceController.deleteService,
);

router.patch(
  "/:id/toggle",
  protect,
  restrictTo("admin"),
  serviceController.toggleServiceStatus,
);

router.get("/popular/list", serviceController.getPopularServices);

module.exports = router;
