const { createWomenInitiative } = require("../models/WomenInitiative");

// ---------------- Submit form ----------------
const submitWomenInitiative = async (req, res) => {
  try {
    const { name, age, email, phone, whatsapp, telegram, location, city } = req.body;
    const files = req.files || {};

    // Validate required fields
    if (!name || !age || !email) {
      return res.status(400).json({ message: "Name, age, and email are required" });
    }

    // Map uploaded files to local paths
    const data = {
      name,
      age: Number(age) || 0,
      email,
      phone: phone || null,
      whatsapp: whatsapp || null,
      telegram: telegram || null,
      location: location || null,
      city: city || null,
      idOrPassport: files.idOrPassport?.[0]?.filename ? `/uploads/${files.idOrPassport[0].filename}` : null,
      photo: files.photo?.[0]?.filename ? `/uploads/${files.photo[0].filename}` : null,
      certificates: files.certificates?.length > 0 
        ? files.certificates.map(f => `/uploads/${f.filename}`).join(",") 
        : null,
    };

    console.log("📝 Women Initiative Data:", data);
    await createWomenInitiative(data);
    
    res.status(201).json({ 
      message: "Women Initiative form submitted successfully",
      data: {
        name: data.name,
        email: data.email
      }
    });
  } catch (err) {
    console.error("❌ Women Initiative Error:", err);
    res.status(500).json({ 
      message: "Failed to submit women initiative form",
      error: err.message 
    });
  }
};

module.exports = { submitWomenInitiative };
