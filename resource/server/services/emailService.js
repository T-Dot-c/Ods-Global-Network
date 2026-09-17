// services/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendGiftEmail({ to, subject, html, text }) {
  try {
    console.log(`📧 Attempting to send email to: ${to}`);
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured");
      throw new Error("Email service not configured");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // your app password
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log("✅ Email transporter verified");

    const result = await transporter.sendMail({
      from: `"Wanaw Gifting" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`❌ Email sending failed to ${to}:`, error);
    throw error;
  }
}

module.exports = sendGiftEmail;

