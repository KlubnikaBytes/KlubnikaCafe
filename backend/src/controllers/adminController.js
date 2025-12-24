// backend/src/controllers/adminController.js

const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

// Sample hardcoded admin credentials
const ADMIN_USERNAME = 'klubnika_cafeadmin';
const ADMIN_PASSWORD = 'OverCoffee@757';

// --- 1. Admin Login ---
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

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
        $match: {
          $and: [
            // 1. STRICTLY Exclude Cancelled Orders (Case Insensitive Regex)
            { status: { $not: /cancelled/i } }, 

            // 2. Logic: If Payment is Cash/COD, only count if status is NOT 'Pending'.
            // (i.e. Exclude if Payment contains "Cash" AND Status is "Pending")
            {
              $nor: [
                {
                  paymentMethod: { $regex: 'Cash', $options: 'i' }, 
                  status: 'Pending'
                }
              ]
            }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" } 
        }
      },
      { 
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
    const startDate = new Date(year, month - 1, 1); 
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      $and: [
        // 1. STRICTLY Exclude Cancelled
        { status: { $not: /cancelled/i } },
        
        // 2. Exclude Pending Cash Orders
        {
          $nor: [
            {
              paymentMethod: { $regex: 'Cash', $options: 'i' },
              status: 'Pending'
            }
          ]
        }
      ]
    })
    .populate('user', 'name email mobile') 
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
};
