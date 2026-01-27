const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  downloadInvoice,
  cancelOrder,
  getAssignedOrders, // ✅ Make sure this is imported
} = require("../controllers/orderController.js");

const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware.js");

// ==================================================================
// ✅ CRITICAL FIX: SPECIFIC ROUTES MUST BE AT THE TOP
// ==================================================================

// 1. Get Assigned Orders (Delivery App)
// This MUST come before /:id routes, otherwise "assigned" is treated as an ID
router.get("/assigned", authenticateToken, getAssignedOrders);

// 2. User: Get My Orders
router.get("/my-orders", authenticateToken, getMyOrders);

// 3. Admin: Get All Orders
router.get("/", authenticateAdmin, getAllOrders);

// ==================================================================
// ⚠️ DYNAMIC ROUTES (/:id) MUST BE AT THE BOTTOM
// ==================================================================

// 4. Invoice Route
router.get("/:id/invoice", downloadInvoice);

// 5. Cancel Order
router.put("/:id/cancel", authenticateToken, cancelOrder);

// 6. Update Status
router.put("/:id/status", authenticateToken, updateOrderStatus);

module.exports = router;
