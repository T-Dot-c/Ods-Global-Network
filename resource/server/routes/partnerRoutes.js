// routes/partnerRequestRoutes.js
const express = require("express");
const uploadLocal = require("../middleware/uploadLocal"); // For documents/PDFs (partner requests are mostly documents)
const PartnerRequest = require("../models/PartnerRequest");
const sendGiftEmail = require("../services/emailService");

const router = express.Router();

// POST: Partner Request
// Note: Using uploadLocal for all files since partner requests are mostly documents
// If logo needs to go to Cloudinary, we can enhance this later
router.post(
  "/partner-request",
  uploadLocal.fields([
    { name: "idOrPassport" },
    { name: "license" },
    { name: "tradeRegistration" },
    { name: "businessProposal" },
    { name: "businessPlan" },
    { name: "logo" },
    { name: "mouSigned" },
    { name: "contractSigned" },
  ]),
  async (req, res) => {
    try {
      console.log("📥 Body:", req.body);
      console.log("📁 Files:", req.files);

      const {
        tab,
        investmentType,
        sector,
        name,
        companyName,
        email,
        phone,
        officePhone,
        whatsapp,
        enquiry,
        motto,
        specialPackages,
        messages,
        coBrand,
        effectiveDate,
        expiryDate,
      } = req.body;

      const files = req.files;

      const newRequest = new PartnerRequest({
        tab,
        investmentType:
          tab === "Investor" && investmentType ? investmentType.split(",") : [],
        sector,
        name,
        companyName,
        email,
        phone,
        officePhone,
        whatsapp,
        enquiry,
        motto,
        specialPackages,
        messages,
        coBrand,
        effectiveDate: effectiveDate || null,
        expiryDate: expiryDate || null,
        idOrPassport: files?.idOrPassport?.[0]?.filename ? `/uploads/${files.idOrPassport[0].filename}` : "",
        license: files?.license?.[0]?.filename ? `/uploads/${files.license[0].filename}` : "",
        tradeRegistration: files?.tradeRegistration?.[0]?.filename ? `/uploads/${files.tradeRegistration[0].filename}` : "",
        businessProposal: files?.businessProposal?.[0]?.filename ? `/uploads/${files.businessProposal[0].filename}` : "",
        businessPlan: files?.businessPlan?.[0]?.filename ? `/uploads/${files.businessPlan[0].filename}` : "",
        logo: files?.logo?.[0]?.filename ? `/uploads/${files.logo[0].filename}` : "",
        mouSigned: files?.mouSigned?.[0]?.filename ? `/uploads/${files.mouSigned[0].filename}` : "",
        contractSigned: files?.contractSigned?.[0]?.filename ? `/uploads/${files.contractSigned[0].filename}` : "",
      });

      await newRequest.save(); // save into MySQL

      res.status(201).json({
        message: "Partner request submitted successfully!",
        data: newRequest,
      });
    } catch (err) {
      console.error("❌ Submission error:", err);
      res.status(500).json({
        error: "Failed to submit partner request.",
        details: err.message,
      });
    }
  }
);

// GET: All Partner Requests
router.get("/partner-requests", async (req, res) => {
  try {
    const partners = await PartnerRequest.getAll(); // MySQL model method
    res.status(200).json(partners);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch partner requests.",
      details: err.message,
    });
  }
});

// POST: Send email to all partners
router.post("/partner-notify", async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ error: "Subject and message are required." });
    }

    const partners = await PartnerRequest.getAll(); // fetch all partners

    const emailPromises = partners.map((partner) =>
      sendGiftEmail({
        to: partner.email,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      })
    );

    await Promise.all(emailPromises);

    res
      .status(200)
      .json({ message: "Emails sent successfully to all partners!" });
  } catch (err) {
    console.error("❌ Email sending error:", err);
    res.status(500).json({
      error: "Failed to send emails.",
      details: err.message,
    });
  }
});

module.exports = router;
