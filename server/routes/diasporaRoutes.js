const express = require("express");
const router = express.Router();
const { createDiasporaMember, getAllDiasporaMembers } = require("../controllers/diasporaController");
const sendGiftEmail = require("../services/emailService"); // import your email service
const DiasporaMember = require("../models/DiasporaMember");

// Existing routes
router.post("/", createDiasporaMember);
router.get("/all", getAllDiasporaMembers);

// NEW: Send email to all diaspora members
router.post("/notify", async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: "Subject and message are required." });

    const members = await DiasporaMember.find();
    const emails = members.map((m) => m.email);

    for (const email of emails) {
      await sendGiftEmail({ to: email, subject, html: `<p>${message}</p>`, text: message });
    }

    res.status(200).json({ message: "Emails sent successfully to all diaspora members!" });
  } catch (err) {
    console.error("❌ Sending emails error:", err);
    res.status(500).json({ error: "Failed to send emails.", details: err.message });
  }
});

module.exports = router;

