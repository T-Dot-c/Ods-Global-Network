
// server/controllers/purchaseController.js
const { pool } = require("../config/db"); // your mysql2 pool connection
const { sendMultiChannel } = require("../utils/notification");

const sendGiftEmail = require("../services/emailService");

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
    return `${req.protocol}://${req.get("host")}${imageUrl}`;
  }
  
  // Fallback: assume it's a filename
  return `${req.protocol}://${req.get("host")}/uploads/${imageUrl}`;
};

exports.getProviderPurchases = async (req, res) => {
  try {
    const { providerId } = req.params;
    console.log("🔍 Backend: getProviderPurchases called with providerId:", providerId);
    console.log("🔍 Backend: Authenticated user:", req.user);

    const providerIdNum = Number(providerId);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const isOwnProvider =
      (user.role === "provider" || user.role === "corporate") &&
      Number(user.id) === providerIdNum;
    const isSuper = user.role === "super_admin";

    let allowedAsAgent = false;
    if (user.role === "standard_agent" || user.role === "elite_agent") {
      const [links] = await pool.query(
        "SELECT 1 FROM agent_provider_links WHERE agent_id = ? AND provider_id = ? LIMIT 1",
        [user.id, providerIdNum]
      );
      allowedAsAgent = links.length > 0;
    }

    if (!isOwnProvider && !isSuper && !allowedAsAgent) {
      return res.status(403).json({
        msg: "Not authorized to view bookings for this professional",
      });
    }

    // 1️⃣ Fetch purchases with service info including discount
    const [purchases] = await pool.query(
      `SELECT p.*, 
              s.title AS serviceTitle, 
              s.category AS serviceCategory, 
              s.location AS serviceLocation, 
              s.price AS servicePrice,
              s.discount AS serviceDiscount
       FROM purchases p
       LEFT JOIN services s ON p.itemId = s.id
       WHERE p.providerId = ?
       ORDER BY p.created_at DESC`,
      [providerId]
    );

    if (!purchases.length) return res.json([]);

    // 2️⃣ Collect purchase IDs
    const purchaseIds = purchases.map((p) => p.id);

    // 3️⃣ Fetch gift_notifications for those purchases
    let giftNotifications = [];
    if (purchaseIds.length > 0) {
      // Use proper SQL syntax for IN clause with array
      const placeholders = purchaseIds.map(() => '?').join(',');
      const [giftRows] = await pool.query(
        `SELECT * FROM gift_notifications WHERE purchase_id IN (${placeholders})`,
        purchaseIds
      );
      giftNotifications = giftRows;
    }

    // 4️⃣ Group gift_notifications by purchase_id
    const giftMap = {};
    giftNotifications.forEach((g) => {
      let recipient = {};
      try {
        recipient = JSON.parse(g.recipient || "{}");
      } catch (err) {
        console.error("❌ Failed to parse gift recipient JSON:", err);
        recipient = {};
      }

      if (!giftMap[g.purchase_id]) giftMap[g.purchase_id] = [];
      giftMap[g.purchase_id].push({
        giftCode: g.gift_code || "N/A",
        recipient: {
          ...recipient,
          name: g.recipient_name || recipient.name || "N/A",
          email: g.recipient_email || recipient.email || "",
          phone: g.recipient_phone || recipient.phone || "",
          whatsapp: g.recipient_whatsapp || recipient.whatsapp || "",
          telegram: g.recipient_telegram || recipient.telegram || "",
          photo: fixImageUrl(g.recipient_photo || recipient.photo, req),
        },
        deliveryStatus: g.delivery_status || "pending",
        occasion: g.occasion || "Not specified",
      });
    });
    // Do NOT send notifications when merely fetching purchases for display.
    // Notifications are handled explicitly on status updates.
    console.log("🔍 Backend: Found purchases:", purchases.length);
    console.log("🔍 Backend: Found gift notifications:", giftNotifications.length);
    console.log("🔍 Backend: Gift map:", Object.keys(giftMap).length, "entries");
    
    // Log purchase details for verification
    if (purchases.length > 0) {
      console.log("📊 Sample purchase details:");
      purchases.slice(0, 3).forEach(p => {
        console.log(`  Purchase ID: ${p.id}, Buyer: ${p.buyerName}, Amount: ${p.total_amount}, Service: ${p.serviceTitle || 'N/A'}`);
      });
    }

    // 5️⃣ Format purchases with parsed recipients + gift notifications
    const result = purchases.map((p) => {
      let parsedRecipients = [];
      if (p.extraInfo) {
        if (typeof p.extraInfo === "string") {
          try {
            parsedRecipients = JSON.parse(p.extraInfo);
          } catch (e) {
            console.error("❌ Failed to parse purchase extraInfo JSON:", e);
            parsedRecipients = [];
          }
        } else if (typeof p.extraInfo === "object") {
          parsedRecipients = p.extraInfo; // already object
        }
      }

      // Calculate the correct discounted price
      // IMPORTANT: total_amount stored in DB should already be discounted (calculated at purchase time)
      // But we recalculate to ensure accuracy, especially for older purchases
      let finalAmount = p.total_amount;
      
      if (p.servicePrice) {
        const basePrice = parseFloat(p.servicePrice) || 0;
        const discount = parseFloat(p.serviceDiscount) || 0;
        
        // Calculate discounted price per service
        let discountedPricePerService = basePrice;
        if (discount > 0 && discount <= 100) {
          discountedPricePerService = basePrice * (1 - discount / 100);
        }
        
        // For gift purchases, multiply by number of recipients
        // For self-purchases, use single price
        const recipientCount = parsedRecipients && parsedRecipients.length > 0 ? parsedRecipients.length : 1;
        const calculatedTotal = discountedPricePerService * recipientCount;
        
        // Use stored total_amount if it exists and seems reasonable, otherwise use calculated
        // This ensures we show the actual amount that was charged/recorded
        if (p.total_amount && p.total_amount > 0) {
          finalAmount = p.total_amount; // Trust the stored amount from purchase
          console.log(`💰 Purchase ${p.id}: Using stored total_amount=${finalAmount}, calculated=${calculatedTotal}, recipients=${recipientCount}`);
        } else {
          finalAmount = calculatedTotal;
          console.log(`💰 Purchase ${p.id}: No stored total_amount, using calculated=${finalAmount}`);
        }
      }

      // Extract buyer phone from recipients if available (first recipient for self-purchases)
      let buyerPhone = '';
      if (parsedRecipients && parsedRecipients.length > 0) {
        // For self-purchases, the buyer is typically the first recipient
        const firstRecipient = parsedRecipients[0];
        buyerPhone = firstRecipient.phone || firstRecipient.whatsapp || '';
      }

      return {
        id: p.id,
        itemType: p.itemType,
        item: {
          id: p.itemId,
          title: p.serviceTitle || "Untitled",
          category: p.serviceCategory,
          location: p.serviceLocation,
          price: p.servicePrice,
          discount: p.serviceDiscount || 0,
        },
        provider: {
          id: p.providerId,
        },
        buyerName: p.buyerName,
        buyerEmail: p.buyerEmail,
        buyerPhone: buyerPhone,
        amount: parseFloat(finalAmount) || 0, // Ensure it's a number, already discounted from DB
        // Add metadata for verification
        isRealPurchase: true, // Flag to verify this is a real purchase from database
        storedAmount: p.total_amount, // Original amount from database
        calculatedAmount: finalAmount, // Amount we're displaying
        status: p.status || "pending",
        purchaseDate: p.created_at,
        deliveryDate: p.deliveryDate,
        recipients: parsedRecipients,
        gifts: giftMap[p.id] || [],
      };
    });

    console.log("🔍 Backend: Final result:", result.length, "purchases");
    if (result.length > 0) {
      console.log("🔍 Backend: First purchase:", {
        id: result[0].id,
        buyerName: result[0].buyerName,
        gifts: result[0].gifts?.length || 0,
        recipients: result[0].recipients?.length || 0
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching provider purchases:", err);
    res.status(500).json({
      msg: "Failed to fetch provider purchases",
      error: err.message,
    });
  }
};




/**
 * Update Gift Status + Notify Recipient
 */


exports.updateGiftStatus = async (req, res) => {
  try {
    const { giftCode, newStatus } = req.body;

    if (!giftCode || !newStatus) {
      return res.status(400).json({ msg: "giftCode and newStatus are required" });
    }

    const status = newStatus.toLowerCase();
    const allowedStatuses = ["pending", "delivered", "canceled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
    }

    // 1️⃣ Find the gift notification
    const [rows] = await pool.query(
      "SELECT * FROM gift_notifications WHERE gift_code = ? LIMIT 1",
      [giftCode]
    );

    if (!rows.length) return res.status(404).json({ msg: "Gift not found" });
    const gift = rows[0];

    // 2️⃣ Fetch purchase extraInfo in case recipient contact is missing
    const [purchaseRows] = await pool.query(
      "SELECT extraInfo FROM purchases WHERE id = ? LIMIT 1",
      [gift.purchase_id]
    );

    let extraRecipient = {};
    if (purchaseRows.length && purchaseRows[0].extraInfo) {
      try {
        const extraRecipients = typeof purchaseRows[0].extraInfo === "string"
          ? JSON.parse(purchaseRows[0].extraInfo)
          : purchaseRows[0].extraInfo;

        // Find recipient by giftCode or fallback to first
        extraRecipient = extraRecipients.find(r => r.giftCode === giftCode) || extraRecipients[0] || {};
      } catch (err) {
        console.error("❌ Failed to parse purchase extraInfo JSON:", err);
        extraRecipient = {};
      }
    }

    // 3️⃣ Update gift status
    const deliveredAt = status === "delivered" ? new Date() : null;
    await pool.query(
      "UPDATE gift_notifications SET delivery_status = ?, delivered_at = ? WHERE gift_code = ?",
      [status, deliveredAt, giftCode]
    );

    // 4️⃣ Merge recipient info
    const recipient = {
      name: gift.recipient_name || extraRecipient.name || "there",
      email: gift.recipient_email || extraRecipient.email || "",
      phone: gift.recipient_phone || extraRecipient.phone || "",
      whatsapp: gift.recipient_whatsapp || extraRecipient.whatsapp || "",
      telegram: gift.recipient_telegram || extraRecipient.telegram || "",
    };

    // Only notify on explicit delivery confirmation to avoid unnecessary emails
    if (status === "delivered") {
      if (!recipient.email && !recipient.phone && !recipient.whatsapp && !recipient.telegram) {
        console.warn(`❌ No recipient contact info available for gift: ${giftCode}`);
      } else {
        console.log("📣 Sending delivery confirmation notifications to recipient:", recipient);
        const subject = `🎁 Your Gift Has Been Delivered`;

        const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width:600px; margin:auto; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color:#1c2b21; padding:20px; text-align:center;">
      <h1 style="margin:0; color:#D4AF37; font-size:24px;">Wanaw Gifting Solution</h1>
    </div>

    <!-- Body -->
    <div style="background-color:#ffffff; padding:30px; color:#333; line-height:1.6;">
      <p style="font-size:16px;">Hello <strong>${recipient.name}</strong>,</p>
      <p style="font-size:16px;">Your gift with code <strong>${giftCode}</strong> has been <strong style="color:#1c2b21;">DELIVERED</strong>.</p>
      <p style="font-size:16px;">We hope you enjoy your experience with <strong>Wanaw Gifting Solution</strong>!</p>

      <div style="text-align:center; margin-top:30px;">
        <a href="https://www.wanaw.et/" 
           style="display:inline-block; padding:14px 28px; background-color:#D4AF37; color:#1c2b21; text-decoration:none; font-weight:bold; border-radius:6px; font-size:16px;">
          Redeem Your Gift
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color:#1c2b21; padding:15px; text-align:center; font-size:12px; color:#D4AF37;">
      &copy; ${new Date().getFullYear()} Wanaw Gifting Solution. All rights reserved.
    </div>
  </div>
`;
        const text = `Hello ${recipient.name}! Your gift (${giftCode}) has been delivered.\nRedeem at: https://www.wanaw.et/`;

        const notificationResults = await sendMultiChannel({
          email: recipient.email,
          phone: recipient.phone,
          whatsapp: recipient.whatsapp,
          telegram: recipient.telegram,
          subject,
          html,
          text,
        });

        console.log("📣 Delivery notification results for gift", giftCode, ":", notificationResults);
      }
    }

    res.status(200).json({
      msg: `✅ Gift status updated to ${status} and recipient notified (if contact info available)`,
      giftCode,
      deliveryStatus: status,
      recipient: {
        name: recipient.name,
        hasEmail: !!recipient.email,
        hasPhone: !!recipient.phone,
        hasWhatsApp: !!recipient.whatsapp,
        hasTelegram: !!recipient.telegram
      }
    });
  } catch (err) {
    console.error("❌ Error updating gift status:", err);
    res.status(500).json({ msg: "Failed to update gift status", error: err.message });
  }
};

/* ─────────────────────────────
   Update Purchase Status (Provider)
───────────────────────────── */
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { newStatus } = req.body;
    const providerId = req.user?.id;

    if (!purchaseId || !newStatus) {
      return res.status(400).json({ msg: "purchaseId and newStatus are required" });
    }

    const status = newStatus.toLowerCase();
    const allowedStatuses = ["pending", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
    }

    // 1️⃣ Verify the purchase belongs to this provider
    const [purchaseRows] = await pool.query(
      "SELECT * FROM purchases WHERE id = ? AND providerId = ? LIMIT 1",
      [purchaseId, providerId]
    );

    if (!purchaseRows.length) {
      return res.status(404).json({ msg: "Purchase not found or access denied" });
    }

    const purchase = purchaseRows[0];

    // 2️⃣ Update purchase status
    await pool.query(
      "UPDATE purchases SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, purchaseId]
    );

    // 3️⃣ Notify buyer about status change
    const subject = status === "completed" 
      ? `✅ Your Service Purchase Has Been Completed`
      : status === "cancelled"
      ? `❌ Your Service Purchase Has Been Cancelled`
      : `⏳ Your Service Purchase Status Updated`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width:600px; margin:auto; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
        <div style="background-color:#1c2b21; padding:20px; text-align:center;">
          <h1 style="margin:0; color:#D4AF37; font-size:24px;">Wanaw Gifting Solution</h1>
        </div>
        <div style="background-color:#ffffff; padding:30px; color:#333; line-height:1.6;">
          <p style="font-size:16px;">Hello <strong>${purchase.buyerName}</strong>,</p>
          <p style="font-size:16px;">Your purchase (ID: ${purchaseId}) status has been updated to <strong style="color:#1c2b21;">${status.toUpperCase()}</strong>.</p>
          ${status === "completed" ? "<p style='font-size:16px;'>Thank you for choosing Wanaw Gifting Solution!</p>" : ""}
          ${status === "cancelled" ? "<p style='font-size:16px;'>If you have any questions, please contact our support team.</p>" : ""}
        </div>
        <div style="background-color:#1c2b21; padding:15px; text-align:center; font-size:12px; color:#D4AF37;">
          &copy; ${new Date().getFullYear()} Wanaw Gifting Solution. All rights reserved.
        </div>
      </div>
    `;

    try {
      await sendMultiChannel({
        email: purchase.buyerEmail,
        subject,
        html,
        text: `Your purchase (ID: ${purchaseId}) status has been updated to ${status}.`,
      });
    } catch (emailErr) {
      console.error("❌ Failed to send notification email:", emailErr);
    }

    res.status(200).json({
      msg: `✅ Purchase status updated to ${status} and buyer notified`,
      purchaseId,
      status,
    });
  } catch (err) {
    console.error("❌ Error updating purchase status:", err);
    res.status(500).json({ msg: "Failed to update purchase status", error: err.message });
  }
};

/* ─────────────────────────────
   Get All Purchases (Admin)
───────────────────────────── */
exports.getAllPurchases = async (req, res) => {
  try {
    console.log("🔍 getAllPurchases called by user:", req.user?.id, "role:", req.user?.role);
    const { status, providerId, dateFrom, dateTo } = req.query;

    let query = `
      SELECT p.*, 
             s.title AS serviceTitle, 
             s.category AS serviceCategory, 
             s.location AS serviceLocation, 
             s.price AS servicePrice,
             s.discount AS serviceDiscount,
             u.fullName AS providerName,
             u.email AS providerEmail
      FROM purchases p
      LEFT JOIN services s ON p.itemId = s.id
      LEFT JOIN users u ON p.providerId = u.id
      WHERE p.itemType = 'service'
    `;
    const params = [];

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }
    if (providerId) {
      query += " AND p.providerId = ?";
      params.push(providerId);
    }
    if (dateFrom) {
      query += " AND p.created_at >= ?";
      params.push(dateFrom);
    }
    if (dateTo) {
      query += " AND p.created_at <= ?";
      params.push(dateTo);
    }

    query += " ORDER BY p.created_at DESC";

    console.log("🔍 Executing query:", query);
    console.log("🔍 Query params:", params);
    
    const [purchases] = await pool.query(query, params);
    
    console.log("✅ Found purchases:", purchases.length);

    if (!purchases.length) {
      console.log("ℹ️ No purchases found, returning empty array");
      return res.json([]);
    }

    // Fetch gift notifications for these purchases
    const purchaseIds = purchases.map((p) => p.id);
    let giftNotifications = [];
    
    if (purchaseIds.length > 0) {
      // Use proper SQL syntax for IN clause with array
      const placeholders = purchaseIds.map(() => '?').join(',');
      const [giftRows] = await pool.query(
        `SELECT * FROM gift_notifications WHERE purchase_id IN (${placeholders})`,
        purchaseIds
      );
      giftNotifications = giftRows;
    }

    const giftMap = {};
    giftNotifications.forEach((g) => {
      if (!giftMap[g.purchase_id]) giftMap[g.purchase_id] = [];
      giftMap[g.purchase_id].push({
        giftCode: g.gift_code || "N/A",
        deliveryStatus: g.delivery_status || "pending",
      });
    });

    // Format purchases
    const result = purchases.map((p) => {
      let parsedRecipients = [];
      if (p.extraInfo) {
        if (typeof p.extraInfo === "string") {
          try {
            parsedRecipients = JSON.parse(p.extraInfo);
          } catch (e) {
            console.error("❌ Failed to parse purchase extraInfo JSON:", e);
            parsedRecipients = [];
          }
        } else if (typeof p.extraInfo === "object") {
          parsedRecipients = p.extraInfo;
        }
      }

      // Calculate the correct discounted price (same logic as getProviderPurchases)
      let finalAmount = p.total_amount;
      
      if (p.servicePrice) {
        const basePrice = parseFloat(p.servicePrice) || 0;
        const discount = parseFloat(p.serviceDiscount) || 0;
        
        // Calculate discounted price per service
        let discountedPricePerService = basePrice;
        if (discount > 0 && discount <= 100) {
          discountedPricePerService = basePrice * (1 - discount / 100);
        }
        
        // For gift purchases, multiply by number of recipients
        // For self-purchases, use single price
        const recipientCount = parsedRecipients && parsedRecipients.length > 0 ? parsedRecipients.length : 1;
        const calculatedTotal = discountedPricePerService * recipientCount;
        
        // Use stored total_amount if it exists, otherwise use calculated
        if (p.total_amount && p.total_amount > 0) {
          finalAmount = p.total_amount; // Trust the stored amount from purchase
        } else {
          finalAmount = calculatedTotal;
        }
      }

      // Extract buyer phone from recipients if available
      let buyerPhone = '';
      if (parsedRecipients && parsedRecipients.length > 0) {
        const firstRecipient = parsedRecipients[0];
        buyerPhone = firstRecipient.phone || firstRecipient.whatsapp || '';
      }

      return {
        id: p.id,
        itemType: p.itemType,
        item: {
          id: p.itemId,
          title: p.serviceTitle || "Untitled",
          category: p.serviceCategory,
          location: p.serviceLocation,
          price: p.servicePrice,
          discount: p.serviceDiscount || 0,
        },
        provider: {
          id: p.providerId,
          name: p.providerName,
          email: p.providerEmail,
        },
        buyerName: p.buyerName,
        buyerEmail: p.buyerEmail,
        buyerPhone: buyerPhone,
        amount: parseFloat(finalAmount) || 0,
        status: p.status || "pending",
        purchaseDate: p.created_at,
        deliveryDate: p.deliveryDate,
        recipients: parsedRecipients,
        gifts: giftMap[p.id] || [],
      };
    });

    console.log("✅ Returning", result.length, "formatted purchases");
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching all purchases:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      msg: "Failed to fetch purchases",
      error: err.message,
    });
  }
};
