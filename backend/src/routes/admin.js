const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getInvoiceStats, 
  getMonthlyReport,
  updateUserRole,
  getDeliveryBoys // ✅ 1. Import the new function
} = require('../controllers/adminController');

// Middleware
const { authenticateAdmin } = require('../middlewares/authMiddleware'); 

// --- Routes ---

// 1. Admin Login (Public)
router.post('/login', adminLogin);

router.get('/invoices/stats', authenticateAdmin, getInvoiceStats);

// 3. Download Report Data (Protected)
router.get('/invoices/download', authenticateAdmin, getMonthlyReport);

// 4. Update User Role (Protected)
router.put('/update-role', authenticateAdmin, updateUserRole);

// ✅ 5. Get Delivery Boys (Protected)
// This uses the controller function, preventing the "User not defined" crash
router.get('/delivery-boys', authenticateAdmin, getDeliveryBoys);

module.exports = router;
