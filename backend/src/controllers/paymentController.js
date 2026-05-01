// backend/src/controllers/paymentController.js

const Razorpay = require("razorpay");
const crypto = require("crypto");
const Product = require("../models/Product.js");
const User = require("../models/User.js");
const Order = require("../models/Order.js");
const { sendEmail } = require("../config/mailer.js");
const { sendBillSMS } = require("../utils/smsSender.js");
const { generateInvoicePdfBuffer } = require("./orderController.js");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- HELPER FUNCTIONS ---

const getCleanItemTitle = (title) => {
  if (title && title.startsWith("Extra Cheese (")) {
    return "Extra Cheese";
  }
  return title;
};

const parsePrice = (priceStr) => {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ""));
};

// --- CONTROLLERS ---

// @desc    1. Create Razorpay Order ID
exports.createOrder = async (req, res) => {
  try {
    const { orderType } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const cartItems = user.cart;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // Check Stock
    const uniqueTitles = [...new Set(cartItems.map((item) => getCleanItemTitle(item.title)))];
    const products = await Product.find({ name: { $in: uniqueTitles } });
    const stockMap = new Map();
    products.forEach((p) => stockMap.set(p.name, p.isInStock));

    const unavailableItems = [];
    for (const item of cartItems) {
      const checkTitle = getCleanItemTitle(item.title);
      if (stockMap.has(checkTitle) && !stockMap.get(checkTitle)) {
        unavailableItems.push(item.title);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({ error: `Items sold out: ${unavailableItems.join(", ")}` });
    }

    const subTotal = cartItems.reduce((acc, item) => {
      const priceValue = parsePrice(item.price);
      return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100;

    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
      deliveryCharge = 20;
    }

    const totalWithGst = subTotal + gstAmount + deliveryCharge;

    const options = {
      amount: Math.round(totalWithGst * 100),
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await instance.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    2. Verify Razorpay Payment (Online) & Create Order
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    deliveryAddress,
    deliveryCoords,
    orderType,
    tableNumber
  } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const io = req.io;

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature." });
  }

  try {
    const paymentDetails = await instance.payments.fetch(razorpay_payment_id);
    if (paymentDetails.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment not captured" });
    }

    let payMethod = paymentDetails.method;
    if (payMethod === "wallet") payMethod = `Wallet (${paymentDetails.wallet})`;
    if (payMethod === "emi") payMethod = "Pay Later / EMI";
    if (payMethod === "card") payMethod = `${paymentDetails.card.network} Card`;
    if (payMethod === "upi") payMethod = `UPI (${paymentDetails.vpa})`;

    const user = await User.findById(req.user.id);
    const validCartItems = user.cart;
    const amountPaid = paymentDetails.amount / 100;

    const subTotal = validCartItems.reduce((acc, item) => {
      const priceValue = parsePrice(item.price);
      return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100;
    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
      deliveryCharge = 20;
    }

    const newOrder = new Order({
      user: user._id,
      items: validCartItems,
      subTotal: subTotal,
      gstAmount: gstAmount,
      deliveryCharge: deliveryCharge,
      totalAmount: amountPaid,
      status: "Pending",
      orderType: orderType || 'Delivery',
      tableNumber: (orderType === 'Dine-in') ? tableNumber : undefined,
      deliveryAddress: deliveryAddress,
      deliveryCoords: deliveryCoords,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentMethod: payMethod,
    });

    await newOrder.save();

    user.cart = [];
    await user.save();

    if (io) {
      io.to(user._id.toString()).emit('cartUpdated', []);
    }

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder._id,
    });

    // --- REAL-TIME & BACKGROUND TASKS ---
    (async () => {
      try {
        const populatedOrder = await newOrder.populate("user", "name email mobile");

        // ✅ Socket Emit: Update Admin Dashboard instantly
        if (io) {
          console.log(`📡 [SOCKET] Online Order #${populatedOrder._id.toString().slice(-6)} -> Admins`);
          io.to("admins").emit("newOrder", populatedOrder);
        }

        const shortOrderId = newOrder._id.toString().slice(-6).toUpperCase();
        const invoiceLink = "https://www.klubnikacafe.com/my-orders";

        sendBillSMS(user.mobile, amountPaid, shortOrderId, invoiceLink).catch(
          (err) => console.error("Background SMS Failed:", err.message)
        );

        const emailSubject = `Total Amount Paid #${shortOrderId}`;
        const itemsHtml = validCartItems
          .map((item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
            </tr>`)
          .join("");

        const pdfBuffer = await generateInvoicePdfBuffer(newOrder);

        await sendEmail(
          user.email,
          emailSubject,
          `Your order for ₹${amountPaid} is confirmed.`,
          `<h1>Order Confirmed!</h1><p>Order ID: #${shortOrderId}</p><table>${itemsHtml}</table>`,
          [{
            filename: `invoice-${newOrder._id}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          }]
        );
      } catch (bgError) {
        console.error("Background Notification Error:", bgError);
      }
    })();
  } catch (err) {
    console.error("Verify Error:", err);
    if (!res.headersSent) res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    3. Create Cash/Dine-in Order (No Razorpay)
exports.createCashOrder = async (req, res) => {
  const { orderType, tableNumber, deliveryAddress, deliveryCoords } = req.body;
  const io = req.io;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const cartItems = user.cart;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    const subTotal = cartItems.reduce((acc, item) => {
      const priceValue = parsePrice(item.price);
      return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100;
    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
      deliveryCharge = 20;
    }

    const totalWithGst = subTotal + gstAmount + deliveryCharge;

    let paymentMethodString = orderType === 'Dine-in' ? "Pay at Counter (Cash)" : "Cash on Delivery";

    const newOrder = new Order({
      user: user._id,
      items: cartItems,
      subTotal: subTotal,
      gstAmount: gstAmount,
      deliveryCharge: deliveryCharge,
      totalAmount: totalWithGst,
      status: "Pending",
      paymentMethod: paymentMethodString,
      orderType: orderType || 'Delivery',
      tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
      deliveryCoords: orderType === 'Delivery' ? deliveryCoords : undefined,
    });

    await newOrder.save();

    user.cart = [];
    await user.save();

    if (io) {
      io.to(user._id.toString()).emit('cartUpdated', []);
    }

    res.json({ success: true, orderId: newOrder._id, message: "Order placed successfully!" });

    // --- REAL-TIME & BACKGROUND TASKS ---
    (async () => {
      try {
        const populatedOrder = await newOrder.populate("user", "name email mobile");

        // ✅ Socket Emit: Update Admin Dashboard instantly
        if (io) {
          console.log(`📡 [SOCKET] Cash Order #${populatedOrder._id.toString().slice(-6)} -> Admins`);
          io.to("admins").emit("newOrder", populatedOrder);
        }

        const shortOrderId = newOrder._id.toString().slice(-6).toUpperCase();
        const pdfBuffer = await generateInvoicePdfBuffer(newOrder);

        await sendEmail(
          user.email,
          `Order Placed #${shortOrderId}`,
          `Your order for ₹${totalWithGst} is received.`,
          `<h1>Order Received!</h1><p>Payment: ${paymentMethodString}</p>`,
          [{
            filename: `invoice-${newOrder._id}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          }]
        );
      } catch (bgError) {
        console.error("Background Notification Error (Cash):", bgError);
      }
    })();
  } catch (err) {
    console.error("Cash Order Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};