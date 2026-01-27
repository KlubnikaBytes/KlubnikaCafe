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

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (adjust for production if needed)
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// --- CRITICAL MIDDLEWARE: Attach 'io' to every request ---
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Socket.io Connection Events ---
io.on('connection', (socket) => {
  console.log(`✅ Socket Connected on Backend: ${socket.id}`);

  // Join Room Event
  socket.on('joinRoom', (userId) => {
    if (userId) {
      // 👇 FIX: Force the Room ID to be a String
      const roomName = String(userId);
      
      socket.join(roomName);
      
      // 👇 IMPROVED LOG: See exactly which room was joined
      console.log(`👤 Socket ${socket.id} joined room: ${roomName}`);
    } else {
        console.warn(`⚠️ Socket ${socket.id} tried to join room with NO ID`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Socket Disconnected: ${socket.id}`);
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
  console.log(`🚀 Server running at port ${PORT}`);
});
