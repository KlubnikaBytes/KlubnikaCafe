// backend/src/routes/payment.js
const express = require('express');
const router = express.Router();

const { 
    createOrder, 
    verifyPayment, 
    createCashOrder // <--- 1. Import this new controller
} = require('../controllers/paymentController');

const { authenticateToken } = require('../middlewares/authMiddleware');

// Protected: Only logged-in users can create an ONLINE order (Razorpay)
router.post('/create-order', authenticateToken, createOrder);

// Protected: Only logged-in users can verify an ONLINE payment (Razorpay)
router.post('/verify-payment', authenticateToken, verifyPayment);

// Protected: Only logged-in users can create a CASH / DINE-IN order (No Razorpay)
router.post('/create-cash-order', authenticateToken, createCashOrder); // <--- 2. Add this route

module.exports = router;