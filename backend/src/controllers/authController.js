// backend/src/controllers/authController.js

const User = require('../models/User.js'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../config/mailer.js'); 
const { sendSMS } = require('../utils/smsSender.js'); 
const Product = require('../models/Product.js'); 

/* -------------------------------------------------------------------------- */
/* SIGNUP LOGIC (Generic / Customer)                                          */
/* -------------------------------------------------------------------------- */

exports.sendSignupOtp = async (req, res) => {
  const { email, password, name, mobile, verifyMethod, role, vehicleDetails } = req.body;

  try {
    const existingVerifiedUser = await User.findOne({ 
      $or: [{ email }, { mobile }],
      isVerified: true 
    });
    
    if (existingVerifiedUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; 
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { $or: [{ email }, { mobile }] },
      {
        name,
        email,
        mobile,
        password: hashed,
        signupOtp: otp,
        signupOtpExpires: otpExpires,
        isVerified: false,
        role: role || 'customer', // Default to customer
        vehicleDetails: vehicleDetails || {} 
      },
      { new: true, upsert: true }
    );

    if (verifyMethod === 'email') {
      await sendEmail(email, 'Your Klubnika Signup OTP', `OTP: ${otp}`, `<p>OTP: <strong>${otp}</strong></p>`);
      res.status(200).json({ message: `OTP sent to ${email}` });
    } else {
      await sendSMS(mobile, otp);
      res.status(200).json({ message: `OTP sent to ${mobile}` });
    }

  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ error: 'Email/Mobile already used' });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifySignup = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (user.signupOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.signupOtpExpires)) return res.status(400).json({ error: 'OTP expired' });

    user.isVerified = true;
    user.signupOtp = null;
    user.signupOtpExpires = null;
    await user.save();
    
    res.status(201).json({ message: 'Signup done' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/* -------------------------------------------------------------------------- */
/* DELIVERY PARTNER SPECIFIC LOGIC (Signup & Login)                           */
/* -------------------------------------------------------------------------- */

// ✅ 1. DEDICATED DELIVERY SIGNUP (Handle New & Existing Users)
exports.sendDeliverySignupOtp = async (req, res) => {
  const { name, email, mobile, password, vehicleDetails } = req.body;

  try {
    // Check if user exists (verified or unverified)
    let user = await User.findOne({ $or: [{ email }, { mobile }] });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    
    // Hash password (whether new or updating, we accept the password provided)
    const hashed = await bcrypt.hash(password, 10);

    if (user) {
      // --- SCENARIO A: EXISTING USER (Customer applying to be Driver) ---
      console.log(`🔄 Existing User ${user.email} applying for Delivery.`);
      
      // We start the upgrade process.
      // 1. Generate new OTP for verification
      user.signupOtp = otp;
      user.signupOtpExpires = otpExpires;
      
      // 2. Save the vehicle details they provided
      user.vehicleDetails = vehicleDetails; 
      
      // 3. Update basic info if they changed it
      user.name = name;
      user.password = hashed;
      
      // NOTE: We do NOT change 'role' to 'delivery' yet. 
      // We wait until they verify the OTP in the next step.
      
      await user.save();

    } else {
      // --- SCENARIO B: BRAND NEW USER ---
      console.log(`✨ New Delivery Applicant: ${email}`);
      
      user = new User({
        name,
        email,
        mobile,
        password: hashed,
        role: 'delivery', // Set role directly for new users
        vehicleDetails,
        signupOtp: otp,
        signupOtpExpires: otpExpires,
        isVerified: false // Needs verification
      });
      
      await user.save();
    }

    // Send OTP via SMS (Preferred for delivery partners)
    await sendSMS(mobile, otp);
    res.status(200).json({ message: `OTP sent to ${mobile}` });

  } catch (error) {
    console.error("Delivery Signup Error:", error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// ✅ 2. DEDICATED DELIVERY VERIFY (Finalize the Upgrade)
exports.verifyDeliverySignup = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.signupOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.signupOtpExpires)) return res.status(400).json({ error: 'OTP expired' });

    // ✅ SUCCESS: Finalize the account verification
    user.isVerified = true;
    user.signupOtp = null;
    user.signupOtpExpires = null;
    
    // 🔥 CRITICAL: Force Role to Delivery
    // This effectively "Upgrades" a Customer to a Delivery Partner
    user.role = 'delivery'; 
    
    await user.save();
    
    res.status(201).json({ message: 'Delivery Partner Account Verified!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ 3. Dedicated Login for Delivery App
exports.deliveryLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(`🚚 Delivery Login Attempt: ${email}`); 

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Account not found' });

    // 🛑 STRICT CHECK: Only allow 'delivery' role. Block 'customer' and 'admin'.
    if (user.role !== 'delivery') {
      console.log(`❌ Failed: User role is ${user.role}, not delivery.`);
      return res.status(403).json({ error: 'Access Denied: You are not a registered Delivery Partner.' });
    }

    if (!user.isVerified) return res.status(403).json({ error: 'Account not verified yet' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`✅ Success: ${user.name} logged in.`);
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        vehicleDetails: user.vehicleDetails 
      } 
    });
  } catch (error) {
    console.error("Delivery Login Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* -------------------------------------------------------------------------- */
/* LOGIN LOGIC (Generic / Customer)                                           */
/* -------------------------------------------------------------------------- */

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });    
    // ⚠️ CHANGED: We REMOVED the block that prevented 'delivery' roles from logging in here.
    // Now, a delivery partner can ALSO log in as a customer to order food.
        if (!user.isVerified) return res.status(403).json({ error: 'Account not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token, 
      user: { _id: user._id, email: user.email, name: user.name, mobile: user.mobile } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


// --- THIS IS THE MISSING PART causing your error ---
exports.sendLoginOtp = async (req, res) => {
  const { mobile } = req.body;
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'Mobile not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.signupOtp = otp; 
    user.signupOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendSMS(mobile, otp);
    res.status(200).json({ message: `OTP sent to ${mobile}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.loginWithOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.signupOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.signupOtpExpires)) return res.status(400).json({ error: 'OTP expired' });

    user.signupOtp = null;
    user.signupOtpExpires = null;
    user.isVerified = true; 
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token, 
      user: { _id: user._id, email: user.email, name: user.name, mobile: user.mobile } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAllData = async (req, res) => {
  try {
    if (req.query.secret !== 'klubnika-dev-only') return res.status(403).json({ error: 'Invalid secret' });
    await User.deleteMany({});
    await Product.deleteMany({});
    res.status(200).json({ message: 'All data deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ TOGGLE AVAILABILITY (For Delivery App)
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Toggle the status
    user.isAvailable = !user.isAvailable;
    await user.save();

    res.json({ 
      success: true, 
      isAvailable: user.isAvailable, 
      message: user.isAvailable ? "You are now ONLINE 🟢" : "You are now OFFLINE 🔴" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }

};
