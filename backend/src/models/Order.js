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
  
  // --- FINANCIAL FIELDS ---
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
  
<<<<<<< HEAD
  // ✅ Field required to store delivery cost
=======
  // ✅ FIELD REQUIRED TO STORE THE DATA
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
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
  
  orderType: {
    type: String,
    enum: ['Delivery', 'Dine-in'],
    default: 'Delivery'
  },
  
  tableNumber: { type: String, required: false },

  deliveryAddress: { type: String, required: false },
<<<<<<< HEAD
  
  // ✅ Coordinates for Google Maps Navigation
=======
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
  deliveryCoords: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },

  paymentId: { type: String, required: false },
  razorpayOrderId: { type: String, required: false },
<<<<<<< HEAD
  paymentMethod: { type: String, default: 'Online' },

  // ✅ CRITICAL: Links the order to a specific Delivery Partner
  deliveryBoyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
=======
  paymentMethod: { type: String, default: 'Online' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
>>>>>>> 459c8bee7edfd3ea1b087d84054ec5e7eb7ef00c
