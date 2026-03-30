const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrder);
router.patch(
  "/:id/status",
  restrictTo("admin", "staff", "technician"),
  orderController.updateOrderStatus,
);
router.post(
  "/:id/refund",
  restrictTo("admin", "staff"),
  orderController.processRefund,
);

module.exports = router;
