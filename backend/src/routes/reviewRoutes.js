const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Public routes (anyone can read or write a review)
router.get('/', reviewController.getReviews);
router.post('/', reviewController.addReview);

module.exports = router;