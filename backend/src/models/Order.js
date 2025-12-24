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
  
  // ✅ FIELD REQUIRED TO STORE THE DATA
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
  deliveryCoords: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },

  paymentId: { type: String, required: false },
  razorpayOrderId: { type: String, required: false },
  paymentMethod: { type: String, default: 'Online' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
