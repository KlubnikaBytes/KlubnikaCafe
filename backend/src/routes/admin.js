const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getInvoiceStats, 
  getMonthlyReport 
} = require('../controllers/adminController');

// --- FIXED IMPORT ---
// We import 'authenticateAdmin' because that is what you exported in authMiddleware.js
const { authenticateAdmin } = require('../middlewares/authMiddleware'); 

// --- Routes ---

// 1. Admin Login (Public)
router.post('/login', adminLogin);

// 2. Invoice Stats (Protected)
// We only need 'authenticateAdmin' because it checks the token AND the admin flag.
router.get('/invoices/stats', authenticateAdmin, getInvoiceStats);

// 3. Download Report Data (Protected)
router.get('/invoices/download', authenticateAdmin, getMonthlyReport);

module.exports = router;