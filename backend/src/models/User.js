const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  isVerified: { type: Boolean, default: false },
  signupOtp: { type: String, default: null },
  signupOtpExpires: { type: Date, default: null },
  cart: { type: [cartItemSchema], default: [] },
  
  // Role field
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'delivery'], 
    default: 'customer' 
  },

  // ✅ NEW: Availability Status for Delivery Partners
  isAvailable: {
    type: Boolean,
    default: false 
  },
  
  // ✅ NEW: Delivery Partner Specific Fields
  vehicleDetails: {
    vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Cycle', 'None'], default: 'None' },
    plateNumber: { type: String, default: '' },
    licenseNumber: { type: String, default: '' }
  },

  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
