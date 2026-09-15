const { pool } = require("../config/db");

/* ─────────────────────────────
   Helper: Fix image URLs for production
───────────────────────────── */
const fixImageUrl = (imageUrl, req) => {
  if (!imageUrl) return null;
  if (typeof imageUrl !== "string") return null;
  
  // Convert http:// to https:// for secure connections
  if (imageUrl.startsWith('http://')) {
    return imageUrl.replace('http://', 'https://');
  }
  
  // If it already starts with https, return as is
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Build full URL for relative paths (/uploads/...)
  if (imageUrl.startsWith('/uploads')) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.wanaw.et'
      : `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${imageUrl}`;
  }
  
  // Fallback: assume it's a filename
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.wanaw.et'
    : `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${imageUrl}`;
};

/* ─────────────────────────────
   Create Gift (no email/notification)
───────────────────────────── */

exports.createGift = async (req, res) => {
  try {
    const { title, category, occasion, description, imageUrl, sender_name } = req.body;

    // Get provider_id from authenticated user (set by verifyToken middleware)
    const provider_id = req.user?.id;
    
    if (!provider_id) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    if (!title || !category) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const [result] = await pool.query(
      `INSERT INTO gifts 
      (title, category, occasion, description, image_url, sender_name, provider_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        category,
        occasion || null,
        description || null,
        imageUrl || null,
        sender_name || "Admin",
        provider_id
      ]
    );

    res.status(201).json({
      msg: "✅ Gift created successfully",
      giftId: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creating gift:", err);
    res.status(500).json({ msg: "Failed to create gift", error: err.message });
  }
};



/* ─────────────────────────────
   Confirm Gift Code
───────────────────────────── */
exports.confirmGiftCode = async (req, res) => {
  try {
    const { giftId } = req.params;
    const { code } = req.body;

    if (!giftId || !code) {
      return res.status(400).json({ msg: "Gift ID and code are required" });
    }

    // Fetch the gift notification
    const [notifications] = await pool.query(
      `SELECT * FROM gift_notifications WHERE gift_id = ? AND gift_code = ?`,
      [giftId, code]
    );

    if (notifications.length === 0) {
      return res.status(400).json({ msg: "Invalid gift code or gift ID" });
    }

    const notification = notifications[0];

    if (notification.delivery_status === "delivered") {
      return res.status(200).json({
        msg: "Gift already confirmed",
        status: "delivered",
        giftId: notification.gift_id,
        giftCode: notification.gift_code
      });
    }

    // Update delivery status
    await pool.query(
      `UPDATE gift_notifications SET delivery_status = 'delivered', delivered_at = NOW() WHERE id = ?`,
      [notification.id]
    );

    res.status(200).json({
      msg: "Gift code confirmed successfully",
      status: "delivered",
      giftId: notification.gift_id,
      giftCode: notification.gift_code
    });

  } catch (err) {
    console.error("❌ Error confirming gift code:", err);
    res.status(500).json({ msg: "Server error confirming gift code" });
  }
};


/* ─────────────────────────────
   Fetch Gifts / Gift Codes
───────────────────────────── */
exports.getGiftsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) return res.status(400).json({ msg: "Invalid serviceId" });

    const gifts = await Gift.find({ service: serviceId })
      .populate("service", "title category")
      .populate("recipient", "name email phone")
      .sort({ createdAt: -1 });

    const giftIds = gifts.map(g => g._id);
    const notifications = await GiftNotification.find({ giftId: { $in: giftIds } });

    const giftsWithCodes = gifts.map(g => {
      const notification = notifications.find(n => n.giftId.toString() === g._id.toString());
      return { ...g.toObject(), giftCode: notification ? notification.giftCode : "generating" };
    });

    res.status(200).json(giftsWithCodes);
  } catch (err) {
    console.error("❌ Error fetching service gifts:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllGiftCodes = async (req, res) => {
  try {
    const { status, providerName, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) filter.deliveryStatus = status;
    if (providerName) filter.providerName = { $regex: providerName, $options: "i" };
    if (dateFrom || dateTo) filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);

    const codes = await GiftNotification.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "service", strictPopulate: false })
      .populate({ path: "providerId", select: "name" });

    res.status(200).json(codes);
  } catch (err) {
    console.error("❌ Error fetching gift codes:", err);
    res.status(500).json({ msg: "Server error fetching gift codes" });
  }
};

exports.getAllGiftsWithCodes = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    let query = `
      SELECT 
             gn.id AS notification_id,
             COALESCE(g.id, gn.gift_id) AS gift_id, 
             COALESCE(g.title, 'Gift Service') AS gift_title, 
             CASE 
               WHEN gn.occasion_name IS NOT NULL AND gn.occasion_name != 'Not specified' THEN gn.occasion_name
               WHEN g.occasion IS NOT NULL AND g.occasion != 'Not specified' THEN g.occasion
               ELSE 'Special Gift'
             END AS occasion, 
             COALESCE(gn.sender_name, g.sender_name, p.buyerName, 'Anonymous') AS senderName,
             gn.gift_code, gn.delivery_status, gn.created_at AS code_created_at,
             gn.recipient_name, gn.recipient_email, gn.recipient_phone,
             gn.recipient_whatsapp, gn.recipient_telegram, gn.recipient_photo,
             gn.provider_name, gn.service_location,
             s.title AS service_title, s.category AS service_category,
             u.email AS provider_email,
             p.buyerName, p.buyerEmail, p.extraInfo,
             gn.occasion_name AS raw_occasion_name,
             gn.sender_name AS raw_sender_name,
             gn.recipient_email AS raw_recipient_email,
             gn.recipient_phone AS raw_recipient_phone
      FROM gift_notifications gn
      LEFT JOIN gifts g ON gn.gift_id = g.id
      LEFT JOIN services s ON COALESCE(g.service_id, gn.service_id) = s.id
      LEFT JOIN users u ON s.providerId = u.id
      LEFT JOIN purchases p ON gn.purchase_id = p.id
      WHERE gn.gift_code IS NOT NULL
    `;
    const params = [];

    if (status) {
      query += " AND gn.delivery_status = ?";
      params.push(status);
    }
    if (dateFrom) {
      query += " AND gn.created_at >= ?";
      params.push(dateFrom);
    }
    if (dateTo) {
      query += " AND gn.created_at <= ?";
      params.push(dateTo);
    }

    query += " ORDER BY gn.created_at DESC";

    const [rows] = await pool.query(query, params);
    
    console.log("🔍 Backend: Raw database rows:", rows.length > 0 ? rows[0] : "No rows");
    console.log("🔍 Backend: First row fields:", rows.length > 0 ? {
      occasion: rows[0].occasion,
      senderName: rows[0].senderName,
      recipient_name: rows[0].recipient_name,
      recipient_email: rows[0].recipient_email,
      recipient_phone: rows[0].recipient_phone,
      raw_occasion_name: rows[0].raw_occasion_name,
      raw_sender_name: rows[0].raw_sender_name,
      raw_recipient_email: rows[0].raw_recipient_email,
      raw_recipient_phone: rows[0].raw_recipient_phone,
      buyerName: rows[0].buyerName,
      buyerEmail: rows[0].buyerEmail
    } : "No data");

    // Let's also check if there are any records in gift_notifications at all
    const [testRows] = await pool.query(`
      SELECT id, sender_name, recipient_email, recipient_phone, occasion_name 
      FROM gift_notifications 
      WHERE gift_code IS NOT NULL 
      LIMIT 3
    `);
    console.log("🔍 Backend: Direct gift_notifications query:", testRows);
    
    // Let's also check the exact field names in the database
    const [columnInfo] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'gift_notifications' 
      AND COLUMN_NAME IN ('sender_name', 'recipient_email', 'recipient_phone', 'occasion_name')
      ORDER BY ORDINAL_POSITION
    `);
    console.log("🔍 Backend: gift_notifications column info:", columnInfo);
    
    // Let's also check if there are any records with recipient email and phone
    const [recipientData] = await pool.query(`
      SELECT id, recipient_name, recipient_email, recipient_phone, occasion_name 
      FROM gift_notifications 
      WHERE gift_code IS NOT NULL 
      AND (recipient_email IS NOT NULL OR recipient_phone IS NOT NULL)
      LIMIT 3
    `);
    console.log("🔍 Backend: Records with recipient data:", recipientData);

    // Map results to structured format
    const gifts = rows.map(r => {
      // Parse extraInfo JSON if exists (like in provider dashboard)
      let extraRecipients = [];
      if (r.extraInfo) {
        try {
          extraRecipients = typeof r.extraInfo === "string"
            ? JSON.parse(r.extraInfo)
            : r.extraInfo;
        } catch (err) {
          console.error("❌ Failed to parse purchase extraInfo JSON:", err);
        }
      }

      // Use recipient data from gift_notifications first, then fallback to extraInfo
      const recipientPhoto = r.recipient_photo || (extraRecipients[0]?.photo) || null;
      const recipientData = {
        name: r.recipient_name || (extraRecipients[0]?.name) || "N/A",
        email: r.recipient_email || (extraRecipients[0]?.email) || "",
        phone: r.recipient_phone || (extraRecipients[0]?.phone) || "",
        whatsapp: r.recipient_whatsapp || (extraRecipients[0]?.whatsapp) || "",
        telegram: r.recipient_telegram || (extraRecipients[0]?.telegram) || "",
        photo: recipientPhoto ? fixImageUrl(recipientPhoto, req) : null
      };

      return {
        _id: r.notification_id,
        giftId: r.gift_id,
        title: r.gift_title,
        senderName: r.senderName,
        occasion: r.occasion,
        giftCode: r.gift_code,
        deliveryStatus: r.delivery_status,
        recipient: recipientData,
        service: {
          title: r.service_title,
          category: r.service_category
        },
        provider: {
          fullName: r.provider_name,
          email: r.provider_email
        },
        buyer: {
          name: r.buyerName,
          email: r.buyerEmail
        },
        serviceLocation: r.service_location,
        codeCreatedAt: r.code_created_at
      };
    });

    console.log("🔍 Backend: Final mapped gifts:", gifts.length > 0 ? {
      occasion: gifts[0].occasion,
      buyer: gifts[0].buyer,
      recipient: gifts[0].recipient,
      extraInfo: rows[0]?.extraInfo
    } : "No gifts");

    res.status(200).json(gifts);

  } catch (err) {
    console.error("❌ Error fetching gifts with codes:", err);
    res.status(500).json({ msg: "Server error fetching gifts with codes" });
  }
};

/* ─────────────────────────────
   Delete Gift
───────────────────────────── */
exports.deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    if (!gift) return res.status(404).json({ msg: "Gift not found" });
    res.status(200).json({ msg: "Gift deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to delete gift" });
  }
};
/* ─────────────────────────────
   Fetch All Gifts
───────────────────────────── */
exports.getAllGifts = async (req, res) => {
  try {
    const gifts = await Gift.find()
      .populate("service", "title category")
      .populate("recipient", "name email phone whatsapp telegram")
      .sort({ createdAt: -1 });

    res.status(200).json(gifts);
  } catch (err) {
    console.error("❌ Error fetching all gifts:", err);
    res.status(500).json({ msg: "Server error fetching all gifts" });
  }
};



/* ─────────────────────────────
   Fetch Gifts / Gift Codes
───────────────────────────── */
exports.getGiftsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) return res.status(400).json({ msg: "Invalid serviceId" });

    const [gifts] = await pool.query(
      `SELECT * FROM gifts WHERE service_id = ? ORDER BY created_at DESC`,
      [serviceId]
    );

    const giftIds = gifts.map(g => g.id);
    const [notifications] = await pool.query(
      `SELECT * FROM gift_notifications WHERE gift_id IN (?)`,
      [giftIds.length ? giftIds : [0]]
    );

    const giftsWithCodes = gifts.map(g => {
      const notif = notifications.find(n => n.gift_id === g.id);
      const mappedGift = { 
        ...g, 
        giftCode: notif ? notif.gift_code : "generating",
        imageUrl: fixImageUrl(g.image_url || g.imageUrl, req)
      };
      // Remove the snake_case image_url field to avoid confusion
      delete mappedGift.image_url;
      return mappedGift;
    });

    res.status(200).json(giftsWithCodes);

  } catch (err) {
    console.error("❌ Error fetching service gifts:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllGiftCodes = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    let query = `SELECT gn.*, g.title AS service_title 
                 FROM gift_notifications gn 
                 LEFT JOIN gifts g ON gn.gift_id = g.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += " AND gn.delivery_status = ?";
      params.push(status);
    }
    if (dateFrom) {
      query += " AND gn.created_at >= ?";
      params.push(dateFrom);
    }
    if (dateTo) {
      query += " AND gn.created_at <= ?";
      params.push(dateTo);
    }

    query += " ORDER BY gn.created_at DESC";

    const [codes] = await pool.query(query, params);
    res.status(200).json(codes);

  } catch (err) {
    console.error("❌ Error fetching gift codes:", err);
    res.status(500).json({ msg: "Server error fetching gift codes" });
  }
};


/* ─────────────────────────────
   Delete Gift
───────────────────────────── */
exports.deleteGift = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete notifications first (foreign key safety)
    await pool.query(`DELETE FROM gift_notifications WHERE gift_id = ?`, [id]);

    // Delete the gift
    const [result] = await pool.query(`DELETE FROM gifts WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ msg: "Gift not found" });

    res.status(200).json({ msg: "Gift deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to delete gift" });
  }
};

/* ─────────────────────────────
   Fetch All Gifts
───────────────────────────── */
exports.getAllGifts = async (req, res) => {
  try {
    const [gifts] = await pool.query(`
      SELECT g.*, s.title AS service_title, s.category AS service_category 
      FROM gifts g
      LEFT JOIN services s ON g.service_id = s.id
      ORDER BY g.created_at DESC
    `);

    // Clean up the data - replace ??? with proper apostrophe and fix image URLs
    const cleanedGifts = gifts.map(gift => {
      const mappedGift = {
        ...gift,
        occasion: gift.occasion ? gift.occasion.replace(/\?\?\?/g, "'") : gift.occasion,
        title: gift.title ? gift.title.replace(/\?\?\?/g, "'") : gift.title,
        description: gift.description ? gift.description.replace(/\?\?\?/g, "'") : gift.description,
        imageUrl: fixImageUrl(gift.image_url || gift.imageUrl, req)
      };
      // Remove the snake_case image_url field to avoid confusion
      delete mappedGift.image_url;
      return mappedGift;
    });

    res.status(200).json(cleanedGifts);

  } catch (err) {
    console.error("❌ Error fetching all gifts:", err);
    res.status(500).json({ msg: "Server error fetching all gifts" });
  }
};

/* ─────────────────────────────
   Fetch Gift Codes for Invoice
───────────────────────────── */
exports.getGiftCodesForInvoice = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    if (!purchaseId) return res.status(400).json({ msg: "Purchase ID is required" });

    const [giftCodes] = await pool.query(
      `SELECT 
        gn.gift_code,
        gn.recipient_name,
        gn.recipient_email,
        gn.recipient_phone,
        gn.recipient_photo,
        gn.delivery_status,
        gn.created_at,
        s.title AS service_title,
        s.category AS service_category,
        s.location AS service_location,
        u.fullName AS provider_name,
        u.email AS provider_email
      FROM gift_notifications gn
      LEFT JOIN services s ON gn.service_id = s.id
      LEFT JOIN users u ON gn.provider_id = u.id
      WHERE gn.purchase_id = ?
      ORDER BY gn.created_at DESC`,
      [purchaseId]
    );

    // Fix image URLs for recipient photos
    const formattedGiftCodes = giftCodes.map(code => ({
      ...code,
      recipient_photo: fixImageUrl(code.recipient_photo, req)
    }));

    res.status(200).json(formattedGiftCodes);

  } catch (err) {
    console.error("❌ Error fetching gift codes for invoice:", err);
    res.status(500).json({ msg: "Server error fetching gift codes" });
  }
};

/* ─────────────────────────────
   Send Gift Card Email
───────────────────────────── */
exports.sendGiftCardEmail = async (req, res) => {
  try {
    console.log("📧 Starting gift card email send...");
    console.log("📧 Request body:", req.body);
    
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      giftCode, 
      serviceTitle, 
      occasion, 
      isVip, 
      message 
    } = req.body;

    if (!recipientEmail || !recipientName || !senderName || !giftCode) {
      console.log("❌ Missing required fields:", { recipientEmail, recipientName, senderName, giftCode });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured");
      return res.status(500).json({ 
        success: false, 
        message: "Email service not configured. Please contact administrator." 
      });
    }

    // Import email service
    const { sendEmail } = require("../utils/notification");
    console.log("📧 Email service imported successfully");

    // Create email content
    const subject = `🎁 ${isVip ? 'VIP' : 'Gift'} Card from ${senderName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${isVip ? 'linear-gradient(135deg, #D4AF37, #FFD700)' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)'}; padding: 30px; border-radius: 15px; text-align: center;">
          <h1 style="color: ${isVip ? '#1c2b21' : '#495057'}; margin: 0 0 20px 0;">
            ${isVip ? '👑 VIP GIFT CARD' : '📄 GIFT CARD'}
          </h1>
          
          <div style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #D4AF37; margin: 0 0 15px 0;">🎁 Your Gift Code</h2>
            <div style="background: #1c2b21; color: #D4AF37; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${giftCode}
            </div>
          </div>
          
          <div style="text-align: left; background: rgba(255,255,255,0.8); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>To:</strong> ${recipientName}</p>
            <p><strong>Service:</strong> ${serviceTitle}</p>
            ${occasion ? `<p><strong>Occasion:</strong> ${occasion}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> "${message}"</p>` : ''}
            <p><strong>Card Type:</strong> ${isVip ? '👑 VIP (+15% Premium)' : '📄 Basic'}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: rgba(28, 43, 33, 0.1); border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Redeem your gift at: <a href="https://www.wanaw.et/redeem" style="color: #D4AF37;">www.wanaw.et/redeem</a>
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
      ${isVip ? 'VIP' : 'Gift'} Card from ${senderName}
      
      Your Gift Code: ${giftCode}
      
      Service: ${serviceTitle}
      ${occasion ? `Occasion: ${occasion}` : ''}
      ${message ? `Message: "${message}"` : ''}
      
      Redeem at: https://www.wanaw.et/redeem
    `;

    console.log("📧 Attempting to send email to:", recipientEmail);
    console.log("📧 Email subject:", subject);
    
    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text
    });

    console.log("✅ Email sent successfully to:", recipientEmail);
    res.status(200).json({ 
      success: true, 
      message: "Gift card email sent successfully" 
    });

  } catch (err) {
    console.error("❌ Error sending gift card email:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send email: " + err.message 
    });
  }
};

