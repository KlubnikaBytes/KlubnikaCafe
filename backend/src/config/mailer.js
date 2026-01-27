const nodemailer = require('nodemailer');

// Configure the email transporter for Hostinger
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Now: smtp.hostinger.com
  port: parseInt(process.env.EMAIL_PORT) || 465, // Recommended: 465 for SSL
  secure: true, // Use TRUE for port 465, FALSE for port 587
  auth: {
    user: process.env.EMAIL_USER, // support@klubnikacafe.com
    pass: process.env.EMAIL_PASS, // Your Hostinger Email password
  },
  // Add these for better reliability with custom domains
  tls: {
    rejectUnauthorized: false 
  }
});

/**
 * Sends an email
 */
const sendEmail = async (to, subject, text, html, attachments = []) => {
  try {
    const mailOptions = {
      // IMPORTANT: The 'from' address MUST match EMAIL_USER for Hostinger
      from: `"Klubnika Cafe" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via Hostinger: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Hostinger SMTP Error:', error);
    throw new Error('Failed to send email via Hostinger');
  }
};

module.exports = { sendEmail };