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

// @desc    1. Create Razorpay Order ID (Includes 5% GST + Delivery)
exports.createOrder = async (req, res) => {
  try {
    const { orderType } = req.body; // Expecting 'Delivery' or 'Dine-in'

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

    // --- FINANCIAL CALCULATIONS ---
    const subTotal = cartItems.reduce((acc, item) => {
      const priceValue = parsePrice(item.price);
      return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100; // 5% GST
    
    // Delivery Logic: If Delivery & Subtotal < 500 => 20. Else 0.
    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
        deliveryCharge = 20;
    }

    const totalWithGst = subTotal + gstAmount + deliveryCharge;

    if (isNaN(totalWithGst) || totalWithGst <= 0) {
      return res.status(400).json({ error: "Invalid total amount calculated." });
    }

    const options = {
      amount: Math.round(totalWithGst * 100), // Convert to paise for Razorpay
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Error creating order");

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
    orderType,   // 'Delivery' or 'Dine-in'
    tableNumber  // Optional
  } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const io = req.io;

  // 1. Verify Signature
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature." });
  }

  try {
    // 2. Fetch Payment Details
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

    // --- RE-CALCULATE BREAKDOWN FOR STORAGE ---
    const subTotal = validCartItems.reduce((acc, item) => {
        const priceValue = parsePrice(item.price);
        return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100;
    
    // Determine Delivery Charge based on rules
    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
        deliveryCharge = 20;
    }

    // 3. Create Order
    const newOrder = new Order({
      user: user._id,
      items: validCartItems,
      subTotal: subTotal,
      gstAmount: gstAmount,
      deliveryCharge: deliveryCharge, // SAVE THIS
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
    
    // Clear Cart
    user.cart = [];
    await user.save();
    
    // Respond immediately
    res.json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder._id,
    });

    // Background Tasks
    (async () => {
      try {
        await newOrder.populate("user", "name email mobile");

        // 1. Socket to Admin
        if (io) io.to("admins").emit("newOrder", newOrder);

        // 2. SMS Logic
        const shortOrderId = newOrder._id.toString().slice(-6).toUpperCase();
        const invoiceLink = "https://www.klubnikacafe.com/api/orders";

        sendBillSMS(user.mobile, amountPaid, shortOrderId, invoiceLink).catch(
          (err) => console.error("Background SMS Failed:", err.message)
        );

        // 3. Email Logic
        const emailSubject = `Total Amount Paid #${shortOrderId}`;
        const itemsHtml = validCartItems
          .map(
            (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
          </tr>`
          )
          .join("");

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 20px auto; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
              <div style="background-color: #f43f5e; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed!</h1>
                <p style="color: #ffe4e6; margin: 10px 0 0 0;">Thanks for dining with Klubnika</p>
              </div>
              <div style="padding: 40px 30px;">
                <p style="font-size: 18px; color: #374151;">Hi <strong>${user.name}</strong>,</p>
                
                <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #f3f4f6;">
                  <p style="margin: 0; color: #4b5563;"><strong>Order ID:</strong> #${shortOrderId}</p>
                  <p style="margin: 5px 0 0 0; color: #4b5563;"><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">ITEM</th>
                      <th style="text-align: center; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">QTY</th>
                      <th style="text-align: right; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                
                <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; text-align: right;">
                  <p style="margin: 0; color: #6b7280;">Subtotal: ₹${subTotal}</p>
                  <p style="margin: 5px 0; color: #6b7280;">GST (5%): ₹${gstAmount}</p>
                  
                  <p style="margin: 5px 0; color: ${deliveryCharge > 0 ? '#374151' : 'green'}; font-weight: ${deliveryCharge === 0 ? 'bold' : 'normal'};">
                    Delivery: ${deliveryCharge > 0 ? '₹' + deliveryCharge : 'FREE'}
                  </p>

                  <h2 style="color: #f43f5e; margin-bottom: 10px;">Total: ₹${amountPaid}</h2>
                  
                  <p style="font-size: 11px; color: #ef4444; margin-top: 15px; font-style: italic;">
                     * Note: Delivery charge may change based on the distance.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const pdfBuffer = await generateInvoicePdfBuffer(newOrder);

        await sendEmail(
          user.email,
          emailSubject,
          `Your order for ₹${amountPaid} is confirmed.`,
          emailHtml,
          [
            {
              filename: `invoice-${newOrder._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        );
        console.log(`Background: Email sent for Order ${shortOrderId}`);
      } catch (bgError) {
        console.error("Background Notification Error:", bgError);
      }
    })();

  } catch (err) {
    console.error("Verify Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

// @desc    3. Create Cash/Dine-in Order (In-House / Pay at Counter)
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

    // --- FINANCIAL CALCULATIONS ---
    const subTotal = cartItems.reduce((acc, item) => {
      const priceValue = parsePrice(item.price);
      return acc + priceValue * item.quantity;
    }, 0);

    const gstAmount = Math.round(subTotal * 0.05 * 100) / 100;
    
    // Delivery Logic
    let deliveryCharge = 0;
    if (orderType === 'Delivery' && subTotal < 500) {
        deliveryCharge = 20;
    }

    const totalWithGst = subTotal + gstAmount + deliveryCharge;

    let paymentMethodString = "Cash";
    if (orderType === 'Dine-in') {
      paymentMethodString = "Pay at Counter (Cash)";
    } else if (orderType === 'Delivery') {
      paymentMethodString = "Cash on Delivery";
    }

    // Create Order
    const newOrder = new Order({
      user: user._id,
      items: cartItems,
      subTotal: subTotal,
      gstAmount: gstAmount,
      deliveryCharge: deliveryCharge, // SAVE THIS
      totalAmount: totalWithGst,
      status: "Pending",
      paymentMethod: paymentMethodString,
      
      orderType: orderType || 'Delivery', 
      tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
      deliveryCoords: orderType === 'Delivery' ? deliveryCoords : undefined,
    });

    await newOrder.save();

    // Clear Cart
    user.cart = [];
    await user.save();
    
    res.json({ success: true, orderId: newOrder._id, message: "Order placed successfully!" });

    // Background notifications
    (async () => {
        try {
          const populatedOrder = await newOrder.populate("user", "name email mobile");
          
          if (io) io.to("admins").emit("newOrder", populatedOrder);
  
          const shortOrderId = newOrder._id.toString().slice(-6).toUpperCase();
          const emailSubject = `Order Placed #${shortOrderId} (${paymentMethodString})`;
          
          const itemsHtml = cartItems
            .map(
              (item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.title}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price}</td>
            </tr>`
            )
            .join("");
  
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
              <div style="max-width: 600px; margin: 20px auto; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
                <div style="background-color: #f43f5e; padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Received!</h1>
                  <p style="color: #ffe4e6; margin: 10px 0 0 0;">${paymentMethodString}</p>
                </div>
                <div style="padding: 40px 30px;">
                  <p style="font-size: 18px; color: #374151;">Hi <strong>${user.name}</strong>,</p>
                  
                  <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #f3f4f6;">
                    <p style="margin: 0; color: #4b5563;"><strong>Order ID:</strong> #${shortOrderId}</p>
                    <p style="margin: 5px 0 0 0; color: #4b5563;"><strong>Payment:</strong> ${paymentMethodString}</p>
                  </div>
  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr>
                        <th style="text-align: left; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">ITEM</th>
                        <th style="text-align: center; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">QTY</th>
                        <th style="text-align: right; color: #9ca3af; font-size: 12px; padding-bottom: 10px;">PRICE</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                  
                  <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; text-align: right;">
                    <p style="margin: 0; color: #6b7280;">Subtotal: ₹${subTotal}</p>
                    <p style="margin: 5px 0; color: #6b7280;">GST (5%): ₹${gstAmount}</p>
                    <p style="margin: 5px 0; color: ${deliveryCharge > 0 ? '#374151' : 'green'}; font-weight: ${deliveryCharge === 0 ? 'bold' : 'normal'};">
                      Delivery: ${deliveryCharge > 0 ? '₹' + deliveryCharge : 'FREE'}
                    </p>
                    
                    <h2 style="color: #f43f5e; margin-bottom: 10px;">Total: ₹${totalWithGst}</h2>

                    <p style="font-size: 11px; color: #ef4444; margin-top: 15px; font-style: italic;">
                       * Note: Delivery charge may change based on the distance.
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;
  
          const pdfBuffer = await generateInvoicePdfBuffer(newOrder);
  
          await sendEmail(
            user.email,
            emailSubject,
            `Your order #${shortOrderId} is placed successfully.`,
            emailHtml,
            [
              {
                filename: `invoice-${newOrder._id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ]
          );
          console.log(`Background: Email sent for Cash Order ${shortOrderId}`);
        } catch (bgError) {
          console.error("Background Notification Error (Cash):", bgError);
        }
    })();

  } catch (err) {
    console.error("Cash Order Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
