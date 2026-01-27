import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios"; // Ensure you have axios installed

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const RatingPage = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  
  // State for Data & UI
  const [reviews, setReviews] = useState([]); // Stores DB data
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Reviews on Load
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Determines URL based on environment (Local vs Production)
      // Assuming you set up a proxy or have a global constant for backend URL
      const backendUrl = "http://localhost:5000"; // Change this if deploying
      const res = await axios.get(`${backendUrl}/api/reviews`);
      setReviews(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setLoading(false);
    }
  };

  // 2. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const newReview = { name, rating, comment };

    try {
      const backendUrl = "http://localhost:5000"; // Change this if deploying
      const res = await axios.post(`${backendUrl}/api/reviews`, newReview);
      
      // Add the new review to the list immediately (Optimistic UI)
      setReviews([res.data, ...reviews]);
      
      // Reset Form
      setSubmitted(true);
      setRating(0);
      setName("");
      setComment("");
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);

    } catch (err) {
      console.error("Error posting review:", err);
      setError("Failed to submit review. Please try again.");
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4 md:px-8 text-neutral-200">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h1
            className="text-5xl md:text-7xl mb-4 text-rose-500"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Guest Book
          </h1>
          <p className="text-neutral-400 tracking-wider uppercase text-sm md:text-base">
            Share your experience with us
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: Submission Form */}
          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-md p-8 rounded-2xl border border-neutral-800 shadow-xl h-fit"
          >
            <h2 className="text-2xl font-semibold mb-6 text-white">Write a Review</h2>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Star Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-neutral-400 uppercase tracking-wide">Your Rating</label>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, index) => {
                      const starValue = index + 1;
                      return (
                        <button
                          type="button"
                          key={index}
                          className={`text-3xl transition-colors duration-200 ${
                            starValue <= (hover || rating) ? "text-yellow-400" : "text-neutral-600"
                          }`}
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHover(starValue)}
                          onMouseLeave={() => setHover(rating)}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-neutral-400 uppercase tracking-wide">Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                {/* Comment Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-neutral-400 uppercase tracking-wide">Review</label>
                  <textarea
                    required
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your meal..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  ></textarea>
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={rating === 0}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center space-y-4"
              >
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-bold text-white">Thank You!</h3>
                <p className="text-neutral-400">Your review has been submitted successfully.</p>
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT: Recent Reviews List */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6 text-white px-2">Recent Stories</h2>
            
            {loading ? (
              <p className="text-neutral-500 italic">Loading reviews...</p>
            ) : reviews.length === 0 ? (
               <p className="text-neutral-500 italic">No reviews yet. Be the first!</p>
            ) : (
              <div className="grid gap-6 max-h-[800px] overflow-y-auto pr-2 scrollbar-hide">
                {reviews.map((review) => (
                  <motion.div
                    key={review._id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl hover:border-neutral-700 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{review.name}</h3>
                        <span className="text-xs text-neutral-500">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex text-yellow-400 text-sm">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "opacity-100" : "opacity-20"}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-300 italic">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default RatingPage;