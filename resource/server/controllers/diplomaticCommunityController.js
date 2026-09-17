const DiplomaticCommunity = require("../models/DiplomaticCommunity");
const { sendEmail } = require("../utils/notification");

// Submit diplomatic community form
exports.submitDiplomatic = async (req, res) => {
  try {
    const {
      name, email, phone, alternativePhone, whatsapp, telegram, 
      institution, institutionName, suggestion
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Name and email are required." 
      });
    }

    const entry = new DiplomaticCommunity({
      name,
      email,
      phone: phone || null,
      alternativePhone: alternativePhone || null,
      whatsapp: whatsapp || null,
      telegram: telegram || null,
      institution: institution || null,
      institutionName: institutionName || null,
      suggestion: suggestion || null,
    });

    await entry.save();

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Welcome to Africa Union, Embassy & Diplomatic Community",
      html: `<!-- KEEP YOUR ORIGINAL HTML STYLE HERE --> 
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
  <div style="background-color:#1c2b21; padding: 20px; text-align: center;">
    <h1 style="margin: 0; color: #D4AF37;">Wanaw Health and Wellness</h1>
    <h2 style="margin: 10px 0 0; color: #D4AF37; font-size: 18px;">Africa Union, Embassy & Diplomatic Community</h2>
  </div>
  <div style="padding: 30px; background-color: #fff;">
    <h2 style="color: #1c2b21;">Hello, ${name}!</h2>
    <p style="font-size: 16px; color: #333;">Thank you for joining our Africa Union, Embassy & Diplomatic Community.</p>
    <p style="font-size: 16px; color: #333;">We appreciate your interest and look forward to connecting with you.</p>
    ${institution ? `<p style="font-size: 16px; color: #333;"><strong>Institution:</strong> ${institution}</p>` : ''}
    ${institutionName ? `<p style="font-size: 16px; color: #333;"><strong>Institution Name:</strong> ${institutionName}</p>` : ''}
    <a href="https://www.wanaw.et/" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background-color: #D4AF37; color: #1c2b21; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Wanaw Health and Wellness</a>
    <p style="font-size: 16px; color: #333; margin-top: 30px;">If you have any questions or need assistance, simply reply to this email.</p>
    <p style="font-size: 16px; color: #333; margin-top: 20px;">⭐ Your participation means a lot — together, we can make a difference!</p>
    <p style="font-size: 16px; color: #333;">With care,<br/><strong>The Wanaw Team</strong></p>
  </div>
  <div style="background-color: #1c2b21; padding: 15px; text-align: center; font-size: 13px; color:#D4AF37;">
    &copy; ${new Date().getFullYear()} Wanaw Health and Wellness Digital Solution. All rights reserved.
  </div>
</div>`,
      text: `Hi ${name},\n\nThank you for joining the Africa Union, Embassy & Diplomatic Community.\n\nVisit: https://www.wanaw.et/\n\nWith care,\nThe Wanaw Team`
    });

    res.status(201).json({ 
      success: true, 
      message: "Form submitted successfully." 
    });
  } catch (err) {
    console.error("DiplomaticCommunity error →", err);
    res.status(500).json({ 
      success: false, 
      message: "Submission failed." 
    });
  }
};

// Get all submissions
exports.getAllDiplomaticSubmissions = async (req, res) => {
  try {
    const allSubmissions = await DiplomaticCommunity.getAll();
    res.status(200).json({ success: true, data: allSubmissions });
  } catch (err) {
    console.error("Error fetching diplomatic submissions →", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch submissions." 
    });
  }
};

// Get by ID
exports.getDiplomaticById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await DiplomaticCommunity.getById(id);
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: "No record found." 
      });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    console.error("Error fetching diplomatic by id →", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch record." 
    });
  }
};



