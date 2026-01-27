const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getInvoiceStats, 
<<<<<<< HEAD
  getMonthlyReport,
  updateUserRole,
  getDeliveryBoys // ✅ 1. Import the new function
} = require('../controllers/adminController');

// Middleware
=======
  getMonthlyReport 
} = require('../controllers/adminController');

// --- FIXED IMPORT ---
// We import 'authenticateAdmin' because that is what you exported in authMiddleware.js
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
const { authenticateAdmin } = require('../middlewares/authMiddleware'); 

// --- Routes ---

// 1. Admin Login (Public)
router.post('/login', adminLogin);

// 2. Invoice Stats (Protected)
<<<<<<< HEAD
=======
// We only need 'authenticateAdmin' because it checks the token AND the admin flag.
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
router.get('/invoices/stats', authenticateAdmin, getInvoiceStats);

// 3. Download Report Data (Protected)
router.get('/invoices/download', authenticateAdmin, getMonthlyReport);

<<<<<<< HEAD
// 4. Update User Role (Protected)
router.put('/update-role', authenticateAdmin, updateUserRole);

// ✅ 5. Get Delivery Boys (Protected)
// This uses the controller function, preventing the "User not defined" crash
router.get('/delivery-boys', authenticateAdmin, getDeliveryBoys);

=======
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
module.exports = router;