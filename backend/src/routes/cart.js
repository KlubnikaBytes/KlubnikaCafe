// backend/src/routes/cart.js

const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes here are protected and require a valid token
router.use(authenticateToken);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/decrease', decreaseQuantity);
router.post('/remove', removeFromCart);
router.post('/clear', clearCart);
router.post('/merge', mergeCart);

module.exports = router;