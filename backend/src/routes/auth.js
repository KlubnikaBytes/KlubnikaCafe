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
  toggleAvailability, // ✅ 1. Existing toggle import
  updateFcmToken      // ✅ 2. ADDED: Import the token update controller
} = require('../controllers/authController');

// 👇 Ensure middleware is imported correctly
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
/* GENERAL AUTHENTICATED ROUTES (New)                                         */
/* -------------------------------------------------------------------------- */

// ✅ 3. ADDED: Route to save FCM Token (Critical for Notifications)
// This is called by the Flutter app immediately after login
router.put('/update-fcm', authenticateToken, updateFcmToken);

/* -------------------------------------------------------------------------- */
/* DEV / ADMIN ROUTES                                                         */
/* -------------------------------------------------------------------------- */

// Dev-only (Be careful with this!)
router.delete('/delete-all-data', deleteAllData);

module.exports = router;