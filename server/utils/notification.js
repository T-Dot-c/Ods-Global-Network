// utils/notification.js
require("dotenv").config();
const twilio = require("twilio");
const axios = require("axios");
const nodemailer = require("nodemailer");

// Environment variables
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TWILIO_WHATSAPP_NUMBER,
  EMAIL_USER,
  EMAIL_PASS,
  TELEGRAM_BOT_TOKEN,
} = process.env;

// -------------------- Helpers --------------------
const formatNumber = (n) => (n ? (n.startsWith("+") ? n : `+${n}`) : null);
const logMissing = (what) => console.warn(`⚠️  Skipping ${what} → missing data/env.`);

// -------------------- Twilio --------------------
const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

// -------------------- Nodemailer --------------------
let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      secure: true,
      port: 465,
    });
    console.log("✅ Email transporter configured successfully");
  } catch (error) {
    console.error("❌ Failed to configure email transporter:", error);
  }
} else {
  console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing — email disabled.");
  console.warn("⚠️ To enable email, set EMAIL_USER and EMAIL_PASS in .env file");
}

// -------------------- Email --------------------
const sendEmail = async ({ to, subject, html, text }) => {
  console.log("📧 sendEmail called with:", { to, subject });
  
  if (!transporter) {
    console.error("❌ Email transporter not configured");
    throw new Error("Email transporter not configured");
  }
  
  if (!to) {
    console.error("❌ Recipient email missing");
    throw new Error("Recipient email missing");
  }

  try {
    console.log("📧 Sending email via transporter...");
    const result = await transporter.sendMail({
      from: `"Wanaw Gifting" <${EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    
    console.log("✅ Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// -------------------- SMS --------------------
const sendSMS = async ({ to, message }) => {
  if (!twilioClient) return logMissing("SMS (Twilio not configured)");
  const formatted = formatNumber(to);
  if (!formatted) return logMissing("SMS (no recipient)");
  if (!TWILIO_PHONE_NUMBER) return logMissing("SMS (TWILIO_PHONE_NUMBER missing)");

  await twilioClient.messages.create({
    body: message || " ",
    from: TWILIO_PHONE_NUMBER,
    to: formatted,
  });
};

// -------------------- WhatsApp --------------------
const sendWhatsApp = async ({ to, message }) => {
  if (!twilioClient) return logMissing("WhatsApp (Twilio not configured)");
  const formatted = formatNumber(to);
  if (!formatted) return logMissing("WhatsApp (no recipient)");
  if (!TWILIO_WHATSAPP_NUMBER?.startsWith("whatsapp:"))
    return logMissing("WhatsApp (TWILIO_WHATSAPP_NUMBER must start with whatsapp:+)");

  await twilioClient.messages.create({
    body: message || " ",
    from: TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${formatted}`,
  });
};

// -------------------- Telegram --------------------
const sendTelegram = async ({ chatId, message }) => {
  if (!TELEGRAM_BOT_TOKEN) return logMissing("Telegram (bot token missing)");
  if (!chatId) return logMissing("Telegram (chatId missing)");

  const id = /^[0-9-]+$/.test(String(chatId)) ? chatId : `@${String(chatId).replace(/^@/, "")}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, { chat_id: id, text: message?.trim() || "🎁 You have a new message!" });
};

// -------------------- Multi-channel sender --------------------
const sendMultiChannel = async ({ email, phone, whatsapp, telegram, subject, html, text }) => {
  const results = {};

  // Email
  if (email) {
    try {
      await sendEmail({ to: email, subject, html, text });
      results.email = true;
    } catch (err) {
      console.error("Email failed:", err.message);
      results.email = false;
    }
  }

  // SMS
  if (phone) {
    try {
      await sendSMS({ to: phone, message: text || subject });
      results.sms = true;
    } catch (err) {
      console.error("SMS failed:", err.message);
      results.sms = false;
    }
  }

  // WhatsApp
  if (whatsapp) {
    try {
      await sendWhatsApp({ to: whatsapp, message: text || subject });
      results.whatsapp = true;
    } catch (err) {
      console.error("WhatsApp failed:", err.message);
      results.whatsapp = false;
    }
  }

  // Telegram
  if (telegram) {
    try {
      await sendTelegram({ chatId: telegram, message: text || subject });
      results.telegram = true;
    } catch (err) {
      console.error("Telegram failed:", err.message);
      results.telegram = false;
    }
  }

  return results;
};

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendTelegram,
  sendMultiChannel,
};
