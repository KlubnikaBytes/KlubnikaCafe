// backend/src/models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true // Name should be unique
  },
  price: { 
    type: Number, 
    required: true 
  },
  desc: { 
    type: String 
  },
  image: { 
    type: String // We will need to fix this later to use backend paths
  },
  // --- NEW FIELDS ---
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    default: null
  },
  isInStock: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);