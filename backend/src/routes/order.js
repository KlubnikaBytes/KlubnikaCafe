// backend/src/routes/order.js
const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  downloadInvoice,
  cancelOrder, // <--- 1. Imported cancelOrder
} = require("../controllers/orderController.js");

const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware.js");

// Admin: Get All Orders
router.get("/", authenticateAdmin, getAllOrders);

// User: Get My Orders
router.get("/my-orders", authenticateToken, getMyOrders);

// Public: Invoice Route (for SMS Links & Direct Downloads)
router.get("/:id/invoice", downloadInvoice);

// User & Admin: Cancel Order
// We use authenticateToken so the controller knows WHO is requesting (req.user).
// The controller logic handles whether it's an Admin or the User who owns the order.
router.put("/:id/cancel", authenticateToken, cancelOrder); // <--- 2. Added Cancel Route

// Admin: Update Status
router.put("/:id/status", authenticateAdmin, updateOrderStatus);

module.exports = router;