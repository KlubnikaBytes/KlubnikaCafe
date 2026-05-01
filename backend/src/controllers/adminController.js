const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User'); // ✅ THIS WAS MISSING!

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
            // 1. STRICTLY Exclude Cancelled Orders
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
        { status: { $not: /cancelled/i } },
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

// --- 4. Update User Role ---
exports.updateUserRole = async (req, res) => {
  const { email, role } = req.body;

  const validRoles = ['customer', 'delivery', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Use: customer, delivery, or admin' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { role: role } },
      { new: true } 
    ).select('-password'); 

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user });

  } catch (err) {
    console.error("Role Update Error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// --- 5. Get All Delivery Boys (for Admin Dashboard) ---
exports.getDeliveryBoys = async (req, res) => {
  try {
    // Fetch users with role 'delivery'
    const deliveryBoys = await User.find({ role: 'delivery' })
      .select('name email mobile isAvailable vehicleDetails');
      
    res.json(deliveryBoys);
  } catch (err) {
    console.error("Error fetching delivery boys:", err);
    res.status(500).json({ error: "Server error fetching delivery staff" });
  }
};

