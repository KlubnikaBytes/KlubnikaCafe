<<<<<<< HEAD
=======
// backend/src/routes/order.js
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  downloadInvoice,
<<<<<<< HEAD
  cancelOrder,
  getAssignedOrders, // ✅ Make sure this is imported
=======
  cancelOrder, // <--- 1. Imported cancelOrder
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
} = require("../controllers/orderController.js");

const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware.js");

<<<<<<< HEAD
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
=======
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
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c

module.exports = router;