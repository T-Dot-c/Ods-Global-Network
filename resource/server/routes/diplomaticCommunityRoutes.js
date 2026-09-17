const express = require("express");
const router = express.Router();
const {
  submitDiplomatic,
  getAllDiplomaticSubmissions,
  getDiplomaticById,
} = require("../controllers/diplomaticCommunityController");
const DiplomaticCommunity = require("../models/DiplomaticCommunity");
const { sendEmail } = require("../utils/notification");

router.post("/", submitDiplomatic);
router.get("/", getAllDiplomaticSubmissions);
router.get("/:id", getDiplomaticById);

// Send email to all diplomatic community members
router.post("/notify", async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: "Subject and message are required." 
      });
    }

    const members = await DiplomaticCommunity.getAll();
    const emails = members.map((m) => m.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "No member emails found." 
      });
    }

    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          await sendEmail({ 
            to: email, 
            subject, 
            text: message, 
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="background-color:#1c2b21; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; color: #D4AF37;">Wanaw Health and Wellness</h1>
              </div>
              <div style="padding: 30px; background-color: #fff; border: 1px solid #eee;">
                <p style="font-size: 16px; color: #333; white-space: pre-wrap;">${message}</p>
              </div>
              <div style="background-color: #1c2b21; padding: 15px; text-align: center; font-size: 13px; color:#D4AF37; border-radius: 0 0 8px 8px;">
                &copy; ${new Date().getFullYear()} Wanaw Health and Wellness Digital Solution. All rights reserved.
              </div>
            </div>`
          });
          return { email, status: "sent" };
        } catch (err) {
          console.error(`❌ Failed to send email to ${email}:`, err.message);
          return { email, status: "failed", error: err.message };
        }
      })
    );

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedEmails = results.filter((r) => r.status === "failed");

    res.status(200).json({
      success: true,
      message: `Emails sent: ${sentCount}, Failed: ${failedEmails.length}`,
      sentCount,
      failedCount: failedEmails.length,
      failedEmails,
    });
  } catch (err) {
    console.error("❌ Error sending diplomatic community emails:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to send emails.", 
      details: err.message 
    });
  }
});

module.exports = router;

