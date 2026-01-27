const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
exports.getReviews = async (req, res) => {
  try {
    // Sort by newest first
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error fetching reviews' });
  }
};

// @desc    Add a new review
// @route   POST /api/reviews
exports.addReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    // Basic Validation
    if (!name || !rating || !comment) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }

    const newReview = new Review({
      name,
      rating,
      comment
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error saving review' });
  }
};