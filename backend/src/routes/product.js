// backend/src/routes/product.js

const express = require('express');
const router = express.Router();
const { getProducts, updateStockStatus } = require('../controllers/productController');

// --- MAKE SURE YOU ARE IMPORTING 'authenticateAdmin' FROM THE CORRECT FILE ---
const { authenticateAdmin } = require('../middlewares/authMiddleware.js'); 

// Public route to get all menu items
router.get('/', getProducts);

// Admin-only route to update stock
// This line MUST have 'authenticateAdmin'
router.put('/stock', authenticateAdmin, updateStockStatus);


module.exports = router;