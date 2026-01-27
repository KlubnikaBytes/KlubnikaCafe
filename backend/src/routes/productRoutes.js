const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productController');

// Public route to get all menu items
router.get('/', getProducts);

module.exports = router;