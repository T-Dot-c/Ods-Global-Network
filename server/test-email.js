// Test email configuration
require("dotenv").config();
const { sendEmail } = require("./utils/notification");

async function testEmail() {
  try {
    console.log("🧪 Testing email configuration...");
    console.log("📧 EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
    console.log("📧 EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Missing");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ Email credentials not configured");
      console.log("📝 Please set EMAIL_USER and EMAIL_PASS in your .env file");
      return;
    }
    
    console.log("📧 Attempting to send test email...");
    
    await sendEmail({
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "🧪 Test Email from Wanaw",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D4AF37;">🎉 Email Test Successful!</h1>
          <p>This is a test email from the Wanaw gift card system.</p>
          <p>If you received this email, the email service is working correctly.</p>
          <p style="color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: "Test email from Wanaw gift card system. Email service is working correctly."
    });
    
    console.log("✅ Test email sent successfully!");
    
  } catch (error) {
    console.error("❌ Test email failed:", error.message);
    console.error("📝 Common issues:");
    console.error("   - Check EMAIL_USER and EMAIL_PASS in .env file");
    console.error("   - For Gmail, use App Password instead of regular password");
    console.error("   - Enable 2-factor authentication on Gmail account");
    console.error("   - Check if 'Less secure app access' is enabled (not recommended)");
  }
}

testEmail();

