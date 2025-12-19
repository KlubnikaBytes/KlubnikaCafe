// backend/src/controllers/adminController.js

const jwt = require('jsonwebtoken');
const Order = require('../models/Order'); // Import Order model

// Sample hardcoded admin credentials
const ADMIN_USERNAME = 'klubnika_cafeadmin';//klubnika_cafeadmin
const ADMIN_PASSWORD = 'OverCoffee@757';//OverCoffee@757

// --- 1. Admin Login ---
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check hardcoded credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Login Successful: Create token
    const token = jwt.sign(
      { id: 'admin_user', isAdmin: true },
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ token });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- 2. Get Invoice Stats (Month/Year grouping) ---
exports.getInvoiceStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        // Filter out cancelled orders
        $match: { status: { $ne: 'cancelled' } } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalOrders: { $sum: 1 },
          // FIX APPLIED HERE: Changed "$totalPrice" to "$totalAmount"
          // This fixes the "0" revenue issue if your DB uses 'totalAmount'
          totalRevenue: { $sum: "$totalAmount" } 
        }
      },
      { 
        // Sort by Year (descending) then Month (descending)
        $sort: { "_id.year": -1, "_id.month": -1 } 
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: 'Failed to fetch invoice stats' });
  }
};

// --- 3. Get Monthly Report Data (For Excel Download) ---
exports.getMonthlyReport = async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and Month are required' });
  }

  try {
    // Calculate start and end date for the requested month
    const startDate = new Date(year, month - 1, 1); 
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    })
    .populate('user', 'name email') // Get customer details
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
};