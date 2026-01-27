const Order = require('../models/Order');

// Get orders assigned to the logged-in delivery boy
exports.getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      deliveryBoyId: req.user.id,
      status: { $in: ['Confirmed', 'Preparing', 'Out for Delivery'] } 
    }).populate('user', 'name mobile');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update order status (e.g., Out for Delivery -> Delivered)
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const io = req.io;
  try {
    const order = await Order.findById(req.params.id).populate('user');
    order.status = status;
    await order.save();

    // Real-time update to Customer & Admin
    io.to(order.user._id.toString()).emit('orderStatusUpdate', order);
    io.to('admins').emit('orderStatusUpdate', order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Update Failed' });
  }
};