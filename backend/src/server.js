const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');
const http = require('http'); 
const { Server } = require("socket.io"); 

// Load .env config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ In production, replace '*' with your frontend URL (e.g., "https://klubnikacafe.com")
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// --- CRITICAL MIDDLEWARE: Attach 'io' to every request ---
// This allows you to use `req.io` in your controllers (payment, orders, etc.)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Socket.io Connection Events ---
io.on('connection', (socket) => {
  console.log(`✅ [SOCKET] New Connection: ${socket.id}`);

  // 1. Customer/Driver Room Join
  // Frontend calls: socket.emit('joinRoom', userId);
  socket.on('joinRoom', (userId) => {
    if (userId) {
      // 🔥 CRITICAL FIX: Ensure ID is strictly a string to match Controller logic
      const roomName = String(userId);
      
      socket.join(roomName);
      
      // Emit back a confirmation (Optional, but good for debugging frontend)
      socket.emit('joinedRoom', roomName);
      console.log(`👤 [SOCKET] Socket ${socket.id} joined User/Driver Room: ${roomName}`);
    } else {
      console.warn(`⚠️ [SOCKET] Socket ${socket.id} tried to join room with MISSING ID`);
    }
  });

  // 2. Admin Room Join
  // Frontend calls: socket.emit('adminJoin');
  socket.on('adminJoin', () => {
    socket.join('admins'); 
    console.log(`🛡️ [SOCKET] Socket ${socket.id} joined ADMIN Room`);
  });

  // 3. Disconnect
  socket.on('disconnect', () => {
    // console.log(`❌ [SOCKET] Disconnected: ${socket.id}`); // Uncomment if logs get too noisy
  });
});

// Import Routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart.js');
const adminRoutes = require('./routes/admin.js');
const orderRoutes = require('./routes/order.js'); 

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes); 

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io is initialized and listening`);
});