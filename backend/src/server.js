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
// This allows your controllers (like productController) to access 'req.io'
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Socket.io Connection Events ---
io.on('connection', (socket) => {
  console.log(`✅ Socket Connected on Backend`);

  // Join Room Event (for specific user notifications if needed)
  socket.on('joinRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 Socket joined room`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Socket Disconnected`);
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

const PORT = process.env.PORT || 5000;

// NOTE: We use server.listen instead of app.listen to make sockets work
server.listen(PORT, () => console.log(`🚀 Server running at port ${PORT}`));