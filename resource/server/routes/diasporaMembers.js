const express = require("express");
const router = express.Router();

const {
  createDiasporaMember,
  getAllDiasporaMembers,
} = require("../controllers/diasporaController");
const DiasporaMember = require("../models/DiasporaMember");
const sendGiftEmail = require("../services/emailService");

// Public endpoints used by Diaspora Premium Community join form
router.post("/", createDiasporaMember);
router.get("/", getAllDiasporaMembers);

// Admin endpoint: fetch all diaspora members (matches frontend `/diaspora-members/all`)
router.get("/all", getAllDiasporaMembers);

// Admin endpoint: send email to all diaspora members
router.post("/notify", async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ error: "Subject and message are required." });
    }

    // Fetch all diaspora members from MySQL
    const members = await DiasporaMember.getAll();
    const emails = members
      .map((m) => m.email)
      .filter((email) => !!email);

    // Send email to each member
    for (const email of emails) {
      await sendGiftEmail({
        to: email,
        subject,
        html: `<p>${message}</p>`,
        text: message,
      });
    }

    return res.status(200).json({
      message: "Emails sent successfully to all diaspora members!",
      count: emails.length,
    });
  } catch (err) {
    console.error("❌ Sending emails to diaspora members failed:", err);
    return res.status(500).json({
      error: "Failed to send emails.",
      details: err.message,
    });
  }
});

module.exports = router;



