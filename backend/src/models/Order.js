const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [cartItemSchema],
  
  // --- TAX, DELIVERY & TOTAL FIELDS ---
  subTotal: { 
    type: Number, 
    required: true,
    default: 0
  },
  gstAmount: { 
    type: Number, 
    required: true, 
    default: 0 
  }, 
  
  // ✅ ADDED THIS FIELD: Crucial for Strict Mode on Server
  deliveryCharge: { 
    type: Number, 
    default: 0 
  }, 

  totalAmount: { 
    type: Number, 
    required: true,
  }, 

  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  
  // --- Order Type (Delivery vs Dine-in) ---
  orderType: {
    type: String,
    enum: ['Delivery', 'Dine-in'],
    default: 'Delivery'
  },
  
  // --- Table Number (Only for Dine-in) ---
  tableNumber: {
    type: String,
    required: false,
  },

  // --- Delivery Fields (Optional for Dine-in) ---
  deliveryAddress: {
    type: String,
    required: false, 
  },
  deliveryCoords: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },

  // --- Payment Fields ---
  paymentId: {
    type: String,
    required: false, 
  },
  razorpayOrderId: {
    type: String,
    required: false, 
  },
  paymentMethod: {
    type: String,
    default: 'Online',
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
