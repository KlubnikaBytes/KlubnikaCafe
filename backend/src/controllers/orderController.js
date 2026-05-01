// backend/src/controllers/orderController.js

const Order = require("../models/Order.js");
const User = require("../models/User.js");
const admin = require("../config/firebase.js"); // Firebase Admin for Push Notifications
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const { sendEmail } = require("../config/mailer.js");
const {
  sendUpdateSMS,
  sendDeliveredSMS,
} = require("../utils/smsSender.js");

// Initialize Razorpay
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* -------------------------------------------------------------------------- */
/* HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const generateInvoicePdfBuffer = (order) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on("error", (err) => reject(err));

      // --- PDF HEADER ---
      doc.fontSize(20).text("KLUBNIKA - INVOICE", { align: "center" });
      doc.moveDown();

      doc.fontSize(10).text("Klubnika Restaurant", { align: "right" });
      doc.text("Gobindapur, Chandrakona, West Bengal 721201", { align: "right" });
      doc.moveDown();

      // --- ORDER DETAILS ---
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Customer: ${order.user.name}`);
      doc.text(`Mobile: ${order.user.mobile}`);
      doc.moveDown();
      doc.text(`Delivery Address: ${order.deliveryAddress || 'Dine-in'}`);
      doc.moveDown();

      // --- TABLE HEADER ---
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Item", 50, 250);
      doc.text("Qty", 300, 250);
      doc.text("Price", 400, 250, { align: "right" });
      doc.moveTo(50, 265).lineTo(550, 265).stroke();

      // --- TABLE ROWS ---
      let y = 280;
      doc.font("Helvetica").fontSize(12);

      order.items.forEach((item) => {
        const title =
          item.title && item.title.length > 35
            ? item.title.substring(0, 35) + "..."
            : item.title;
        doc.text(title || "", 50, y);
        doc.text(item.quantity?.toString() || "1", 300, y);
        doc.text(item.price?.toString() || "0", 400, y, { align: "right" });
        y += 20;
      });

      doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();

      // --- TOTALS ---
      y += 30;
      doc.fontSize(11).font("Helvetica");
      
      doc.text("Subtotal:", 350, y);
      doc.text(`Rs. ${order.subTotal || (order.totalAmount / 1.05).toFixed(2)}`, 400, y, { align: "right" });
      
      y += 20;
      doc.text("GST (5%):", 350, y);
      doc.text(`Rs. ${order.gstAmount || (order.totalAmount - (order.totalAmount / 1.05)).toFixed(2)}`, 400, y, { align: "right" });
      
      y += 20;
      doc.text("Delivery Charge:", 350, y);
      const delCharge = order.deliveryCharge || 0;
      doc.text(delCharge === 0 ? "FREE" : `Rs. ${delCharge}`, 400, y, { align: "right" });

      y += 25;
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text("Grand Total:", 300, y);
      doc.text(`Rs. ${order.totalAmount}`, 400, y, { align: "right" });
      
      doc.moveDown(2);
      doc.fontSize(9).fillColor('red').font("Helvetica-Oblique");
      doc.text("* Note: Delivery charge may change based on the distance.", 50, doc.y + 20, { align: "center" });
      
      doc.fillColor('black');
      doc.moveDown(1);
      doc.fontSize(10).font("Helvetica");
      doc.text("Thank you for dining with us!", 50, doc.y, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

/* -------------------------------------------------------------------------- */
/* CONTROLLERS                                 */
/* -------------------------------------------------------------------------- */

// @desc    Get all orders (Admin) OR Download Invoice (via Query Param)
exports.getAllOrders = async (req, res) => {
  // --- INVOICE GENERATION LOGIC ---
  if (req.query.type === 'invoice' && req.query.order_id) {
    try {
      const order = await Order.findById(req.query.order_id).populate(
        "user",
        "name email mobile"
      );
      
      if (!order) {
        return res.status(404).send("Order not found or Invalid Link");
      }

      const pdfBuffer = await generateInvoicePdfBuffer(order);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${order._id}.pdf`
      );
      return res.send(pdfBuffer);
    } catch (err) {
      console.error("Invoice Gen Error:", err);
      return res.status(500).send("Error generating invoice");
    }
  }

  // --- STANDARD GET ALL ORDERS ---
  try {
    const orders = await Order.find({})
      .populate("user", "name email mobile")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get logged-in user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get orders assigned to a Delivery Boy
exports.getAssignedOrders = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    console.log(`\n🔵 [APP REQUEST] Checking orders for Rider ID: ${currentUserId}`);

    const orders = await Order.find({
      deliveryBoyId: currentUserId,
      status: { $regex: /^Out for Delivery$/i } 
    })
    .populate("user", "name email mobile")
    .sort({ createdAt: -1 });

    console.log(`✅ FOUND: ${orders.length} orders for this rider.`);
    res.json(orders);
  } catch (err) {
    console.error("❌ getAssignedOrders Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Update status (Admin/Delivery) & Send All Notifications (Socket, Email, SMS, Push)
exports.updateOrderStatus = async (req, res) => {
  const { status, deliveryBoyId } = req.body;
  const io = req.io;

  try {
    const order = await Order.findById(req.params.id).populate("user", "name email mobile");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // 1. Update DB Status
    order.status = status;
    
    // Check if a driver is being assigned
    if (deliveryBoyId) {
      order.deliveryBoyId = deliveryBoyId;
    }

    await order.save();
    // Re-populate to ensure user data is fresh
    await order.populate("user", "name email mobile");

    // ----------------------------------------------------
    // 🔔 REAL-TIME SOCKET ALERTS
    // ----------------------------------------------------
    
    // A. Alert the Customer (Private Room)
    const userRoom = order.user._id.toString();
    console.log(`📡 [SOCKET] Emitting update to Customer Room: ${userRoom}`);
    io.to(userRoom).emit("orderStatusUpdate", order);

    // B. Alert the Admins
    console.log(`📡 [SOCKET] Emitting update to Admin Dashboard`);
    io.to("admins").emit("orderStatusUpdate", order);

    // C. Alert the Delivery Boy (If assigned)
    if (order.deliveryBoyId) {
       const driverRoom = order.deliveryBoyId.toString();
       console.log(`📡 [SOCKET] Emitting assignment to Driver Room: ${driverRoom}`);
       io.to(driverRoom).emit("newAssignment", {
         title: "New Order! 🛵",
         order: order
       });
    }

    // ----------------------------------------------------
    // 🔔 FIREBASE PUSH NOTIFICATION (Delivery App)
    // ----------------------------------------------------
    const shortId = order._id.toString().slice(-6).toUpperCase();

    if (deliveryBoyId) {
        try {
            const driver = await User.findById(deliveryBoyId);
            if (driver && driver.fcmToken) {
                console.log(`📨 [FCM] Sending push to driver: ${driver.email}`);
                
                await admin.messaging().send({
                    token: driver.fcmToken, 
                    notification: {
                        title: "New Delivery Assigned! 🛵",
                        body: `Order #${shortId} is ready for delivery.`
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default",
                            channelId: "order_alerts",
                        }
                    },
                    data: {
                        orderId: order._id.toString(),
                        type: "assignment"
                    }
                });
                console.log("✅ [FCM] Notification sent successfully!");
            }
        } catch (error) {
            console.error("❌ [FCM] Error Details:", error.message); 
        }
    }

    // ----------------------------------------------------
    // 🔔 EMAIL & SMS ALERTS (Customer)
    // ----------------------------------------------------
    const trackingLink = "https://www.klubnikacafe.com/my-orders";
    const ratingsLink = "https://www.klubnikacafe.com/ratings";

    if (status === "Delivered") {
      // SMS
      sendDeliveredSMS(order.user.mobile, shortId, ratingsLink).catch((err) =>
        console.error("Delivered SMS Error:", err.message)
      );

      // Email
      const deliveredHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background-color: #10b981; padding: 30px; text-align: center; color: white;">
            <h1>Order Delivered!</h1>
            <p>Bon Appétit!</p>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${order.user.name},</p>
            <p>Your order <strong>#${shortId}</strong> has been delivered.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${ratingsLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Rate Us</a>
            </div>
          </div>
        </div>
      `;
      sendEmail(order.user.email, `Order Delivered! #${shortId}`, "Delivered", deliveredHtml)
        .catch((err) => console.error("Delivered Email Error:", err.message));

    } else if (status !== "Pending") {
      // SMS
      sendUpdateSMS(order.user.mobile, shortId, status, trackingLink).catch(
        (err) => console.error("Update SMS Error:", err.message)
      );

      // Email
      const updateHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background-color: #f43f5e; padding: 20px; text-align: center; color: white;">
            <h2>Order Status Update</h2>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${order.user.name},</p>
            <h2 style="color: #f43f5e; text-align: center;">${status}</h2>
            <p style="text-align: center; margin-top: 20px;">
               <a href="${trackingLink}" style="color: #f43f5e; font-weight: bold;">Track Order</a>
            </p>
          </div>
        </div>
      `;
      sendEmail(order.user.email, `Order Update: ${status} #${shortId}`, `Status: ${status}`, updateHtml)
        .catch((err) => console.error("Update Email Error:", err.message));
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Cancel Order & Refund
exports.cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const io = req.io;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin; 

  try {
    const order = await Order.findById(req.params.id).populate("user", "name email mobile");
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!isAdmin && order.status !== "Pending") {
      return res.status(400).json({ error: "Order cannot be cancelled at this stage." });
    }
    
    if (order.status === "Cancelled" || order.status === "Delivered") {
       return res.status(400).json({ error: "Order is already finalized." });
    }

    // Process Refund if Paid
    if (order.paymentId) {
      try {
        const refund = await instance.payments.refund(order.paymentId, {
          amount: Math.round(order.totalAmount * 100),
          speed: "normal",
          notes: {
            reason: reason || "Customer/Admin requested cancellation",
            order_id: order._id.toString()
          }
        });
        console.log("✅ Refund Initiated:", refund.id);
      } catch (refundError) {
        console.error("❌ Razorpay Refund Error:", refundError);
      }
    }

    order.status = "Cancelled";
    await order.save();

    // Socket Emissions
    io.to(order.user._id.toString()).emit("orderStatusUpdate", order);
    io.to("admins").emit("orderStatusUpdate", order);

    // Email Notification
    const shortOrderId = order._id.toString().slice(-6).toUpperCase();
    const cancelHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #ef4444; padding: 30px; text-align: center; color: white;">
          <h1>Order Cancelled</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi ${order.user.name},</p>
          <p>Your order <strong>#${shortOrderId}</strong> has been cancelled.</p>
          <p style="color: #b91c1c;"><strong>Refund Initiated:</strong> ₹${order.totalAmount}</p>
        </div>
      </div>
    `;

    sendEmail(
      order.user.email, 
      `Order Cancelled #${shortOrderId}`, 
      "Order Cancelled", 
      cancelHtml
    ).catch(err => console.error("Cancel Email Error", err));

    res.json({ message: "Order cancelled and refund initiated", order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error during cancellation" });
  }
};

// @desc    Generate and Download PDF Invoice
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email mobile");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(order);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating invoice" });
  }
};

// Export the PDF generator for use in other controllers if needed
exports.generateInvoicePdfBuffer = generateInvoicePdfBuffer;