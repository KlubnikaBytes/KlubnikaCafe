// backend/src/utils/smsSender.js
const axios = require("axios");

// --- CONFIG: DLT IDs ---
const PE_ID = "1201176482962849429"; 
const TEMPLATE_MAP = {
  "KLUB_BILL": "1207176528670416582",
  "KLUB_UPDATES": "1207176536275883709", 
  "KLUB_DELIVERED": "1207176516047212807"
};

// --- Helper: Normalize Mobile ---
const normalizeMobile = (mobile) => {
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  return digits;
};

// --- CORE FUNCTION FOR TRANSACTIONAL SMS ---
const sendTransactionSMS = async (templateKey, mobile, vars) => {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const finalMobile = normalizeMobile(mobile);
  const templateId = TEMPLATE_MAP[templateKey];

  if (!templateId) {
    console.error(`❌ Template ID missing for ${templateKey}`);
    return;
  }

  // --- CRITICAL FIX: Ensure ALL variables are under 30 chars ---
  // If we send a long URL, DLT will block it.
  const cleanVars = vars.map(v => String(v).trim().substring(0, 30));

  const params = new URLSearchParams();
  params.append("module", "TRANS_SMS");
  params.append("apikey", apiKey);
  params.append("to", finalMobile);
  params.append("from", "KLBNKA"); 
  
  // R1 Endpoint params
  params.append("peid", PE_ID);         
  params.append("ctid", templateId);     // Use ctid as you found it works
  params.append("templatename", templateKey);

  params.append("var1", cleanVars[0] || "");
  params.append("var2", cleanVars[1] || "");
  params.append("var3", cleanVars[2] || "");

  const debugUrl = `https://2factor.in/API/R1/?${params.toString()}`;
  console.log(`\n🔗 [DEBUG] Sending ${templateKey}:\n${debugUrl.replace(apiKey, "HIDDEN_KEY")}\n`);

  try {
    const resp = await axios.get(debugUrl);
    console.log(`✅ ${templateKey} Result:`, resp.data);
  } catch (error) {
    console.error(`❌ ${templateKey} Failed:`, error.message);
    if (error.response) console.error("Error Details:", error.response.data);
  }
};

// 1. OTP SENDER
const sendSMS = async (mobile, otp) => {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!mobile) return;
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${otp}/KLUB_OTP`;
  try {
    await axios.get(url);
    console.log("✅ SMS OTP Sent");
  } catch (error) {
    console.error("❌ SMS OTP Failed:", error.message);
  }
};

// 2. INVOICE BILL SENDER (Fixed Link)
const sendBillSMS = async (mobile, amount, orderId, invoiceLink) => {
  if (!mobile) return console.error("Bill SMS: mobile missing");
  
  // --- FIX: Use a Short Link (Max 30 chars) ---
  // Instead of a long invoice URL, send them to the "My Orders" page
  // "klubnikacafe.com/my-orders" is 26 chars. Perfect.
  const shortLink = "klubnikacafe.com/my-orders";
  
  // Template: Bill Amt: {#var#}, OrderID: {#var#}, Link: {#var#}
  await sendTransactionSMS("KLUB_BILL", mobile, [amount, orderId, shortLink]);
};

// 3. ORDER UPDATE SENDER (Working - Kept as is)
const sendUpdateSMS = async (mobile, orderId, status, trackingLink) => {
  if (!mobile) return;
  const specificLink = "klubnikacafe.com/my-orders";
  await sendTransactionSMS("KLUB_UPDATES", mobile, [orderId, status, specificLink]);
};

// 4. DELIVERED SENDER (Fixed Link)
const sendDeliveredSMS = async (mobile, orderId, ratingsLink) => {
  if (!mobile) return;
  
  // --- FIX: Use a Short Link (Max 30 chars) ---
  // "klubnikacafe.com/ratings" is 24 chars. Perfect.
  // Do NOT add https:// or www. or it will exceed 30 chars and fail.
  const shortLink = "klubnikacafe.com/ratings";

  // Template: OrderID: {#var#}, Link: {#var#}
  await sendTransactionSMS("KLUB_DELIVERED", mobile, [orderId, shortLink]);
};

module.exports = { sendSMS, sendBillSMS, sendUpdateSMS, sendDeliveredSMS };