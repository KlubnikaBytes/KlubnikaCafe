const Order = require("../models/Order.js");
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

// Helper: generate invoice PDF into a Buffer
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

      // --- PDF CONTENT ---
      doc.fontSize(20).text("KLUBNIKA - INVOICE", { align: "center" });
      doc.moveDown();

      doc.fontSize(10).text("Klubnika Restaurant", { align: "right" });
      doc.text("123 Food Street, Kolkata", { align: "right" });
      doc.moveDown();

      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Customer: ${order.user.name}`);
      doc.text(`Mobile: ${order.user.mobile}`);
      doc.moveDown();
      doc.text(`Delivery Address: ${order.deliveryAddress || 'Dine-in'}`);
      doc.moveDown();

      // Table Header
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Item", 50, 250);
      doc.text("Qty", 300, 250);
      doc.text("Price", 400, 250, { align: "right" });
      doc.moveTo(50, 265).lineTo(550, 265).stroke();

      // Table Rows
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

      // --- GST & TOTAL BREAKDOWN ---
      y += 30;
      doc.fontSize(11).font("Helvetica");
      
      // Subtotal
      doc.text("Subtotal:", 350, y);
      doc.text(`Rs. ${order.subTotal || (order.totalAmount / 1.05).toFixed(2)}`, 400, y, { align: "right" });
      
      // GST
      y += 20;
      doc.text("GST (5%):", 350, y);
      doc.text(`Rs. ${order.gstAmount || (order.totalAmount - (order.totalAmount / 1.05)).toFixed(2)}`, 400, y, { align: "right" });

      // Grand Total
      y += 25;
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text("Grand Total:", 300, y);
      doc.text(`Rs. ${order.totalAmount}`, 400, y, { align: "right" });

      // Footer
      doc.fontSize(10).font("Helvetica");
      doc.text("Thank you for dining with us!", 50, 700, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

// @desc    Get all orders (Admin) OR Download Invoice (via Query Param)
exports.getAllOrders = async (req, res) => {
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

  try {
    const orders = await Order.find({})
      .populate("user", "name email mobile")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get my orders
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

// @desc    Update status (Admin) & Send Notifications
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const io = req.io;

  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email mobile"
    );
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();
    await order.populate("user", "name email mobile");

    // Socket events
    io.to(order.user._id.toString()).emit("orderStatusUpdate", order);
    io.to("admins").emit("orderStatusUpdate", order);

    const shortOrderId = order._id.toString().slice(-6).toUpperCase();
    const trackingLink = "https://www.klubnikacafe.com/my-orders";
    const ratingsLink = "https://www.klubnikacafe.com/ratings";

    if (status === "Delivered") {
      sendDeliveredSMS(order.user.mobile, shortOrderId, ratingsLink).catch((err) =>
        console.error("Delivered SMS Error:", err.message)
      );

      const deliveredHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 30px; text-align: center; color: white;">
            <h1>Order Delivered!</h1>
            <p>Bon Appétit!</p>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${order.user.name},</p>
            <p>Your order <strong>#${shortOrderId}</strong> has been successfully delivered.</p>
            <p>We hope you enjoy your meal. We would love to hear your feedback!</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://bit.ly/klubnika-rate" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rate Us on Google</a>
            </div>
          </div>
        </div>
      `;

      sendEmail(
        order.user.email,
        `Order Delivered! #${shortOrderId}`,
        "Your order has been delivered.",
        deliveredHtml
      ).catch((err) => console.error("Delivered Email Error:", err.message));

    } else if (status !== "Pending") {
      sendUpdateSMS(order.user.mobile, shortOrderId, status, trackingLink).catch(
        (err) => console.error("Update SMS Error:", err.message)
      );

      const updateHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f43f5e; padding: 20px; text-align: center; color: white;">
            <h2>Order Status Update</h2>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${order.user.name},</p>
            <p>Your order <strong>#${shortOrderId}</strong> is currently:</p>
            <h2 style="color: #f43f5e; text-align: center; margin: 20px 0;">${status}</h2>
            <p style="text-align: center;">
               <a href="${trackingLink}" style="color: #f43f5e; font-weight: bold;">Track your order here</a>
            </p>
          </div>
        </div>
      `;

      sendEmail(
        order.user.email,
        `Order Update: ${status} #${shortOrderId}`,
        `Order status: ${status}`,
        updateHtml
      ).catch((err) => console.error("Update Email Error:", err.message));
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

    io.to(order.user._id.toString()).emit("orderStatusUpdate", order);
    io.to("admins").emit("orderStatusUpdate", order);

    const shortOrderId = order._id.toString().slice(-6).toUpperCase();

    const cancelHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ef4444; padding: 30px; text-align: center; color: white;">
          <h1>Order Cancelled</h1>
          <p>Refund Initiated</p>
        </div>
        <div style="padding: 30px;">
          <p>Hi ${order.user.name},</p>
          <p>Your order <strong>#${shortOrderId}</strong> has been cancelled.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #b91c1c;"><strong>Refund Amount:</strong> ₹${order.totalAmount}</p>
          </div>
          <p><strong>Reason:</strong> ${reason || "Request by user/admin"}</p>
          <p>We hope to serve you again soon!</p>
        </div>
      </div>
    `;

    sendEmail(
      order.user.email, 
      `Order Cancelled #${shortOrderId} - Refund Initiated`, 
      "Your order has been cancelled and refund initiated.", 
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
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email mobile"
    );

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

exports.generateInvoicePdfBuffer = generateInvoicePdfBuffer;