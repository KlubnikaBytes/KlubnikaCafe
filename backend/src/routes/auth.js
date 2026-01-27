const express = require('express');
const {
  sendSignupOtp,
  verifySignup,
  login,
  deliveryLogin,
  sendLoginOtp,
  loginWithOtp,
  deleteAllData,
  sendDeliverySignupOtp,
  verifyDeliverySignup,
  toggleAvailability // ✅ 1. Make sure this is imported
} = require('../controllers/authController');

// 👇 ✅ 2. THIS WAS MISSING! You must import the middleware to use it.
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* CUSTOMER ROUTES                                                            */
/* -------------------------------------------------------------------------- */

// Signup flow (Customer)
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup', verifySignup);

// Login flows (Customer & Delivery Partners ordering food)
router.post('/login', login);
router.post('/send-login-otp', sendLoginOtp);
router.post('/login-with-otp', loginWithOtp);

/* -------------------------------------------------------------------------- */
/* DELIVERY PARTNER ROUTES                                                    */
/* -------------------------------------------------------------------------- */

// Login (Strictly for Delivery App)
router.post('/delivery-login', deliveryLogin);

// Signup (Dedicated flow for new applicants OR existing customers upgrading)
router.post('/delivery-signup', sendDeliverySignupOtp);
router.post('/verify-delivery-signup', verifyDeliverySignup);

// ✅ Availability Toggle (Protected Route)
router.post('/toggle-availability', authenticateToken, toggleAvailability);

/* -------------------------------------------------------------------------- */
/* DEV / ADMIN ROUTES                                                         */
/* -------------------------------------------------------------------------- */

// Dev-only (Be careful with this!)
router.delete('/delete-all-data', deleteAllData);

module.exports = router;
