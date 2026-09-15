/* controllers/notificationController.js */
const { pool } = require("../config/db");
const {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendTelegram,
} = require("../utils/notification");

// Helper to format numbers in +E.164
const formatNumber = (n) => {
  if (!n) return null;
  return /^\+/.test(n) ? n : `+${n}`;
};

const formatDisplayDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

exports.sendGiftNotifications = async (req, res) => {
  try {
    const serviceId = req.body.serviceId || req.params.id;

    // Reconstruct recipients array from FormData or JSON
    let recipients = [];
    
    // First check if recipients is already an array in the body
    if (Array.isArray(req.body.recipients) && req.body.recipients.length > 0) {
      recipients = req.body.recipients;
    } else {
      // Otherwise, try to reconstruct from FormData format
      Object.keys(req.body).forEach((key) => {
        const match = key.match(/^recipients\[(\d+)\]\[(\w+)\]$/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2];
          recipients[index] = recipients[index] || {};
          recipients[index][field] = req.body[key];
        }
      });
      // Filter out undefined entries
      recipients = recipients.filter(r => r && (r.name || r.email || r.phone || r.whatsapp || r.telegram));
    }
    
    // If no recipients found, return early (this is a self-purchase, not a gift)
    if (!recipients || recipients.length === 0) {
      console.log("ℹ️ No recipients provided - skipping gift notifications (self-purchase)");
      return res ? res.status(200).json({ success: true, message: "Self-purchase - no notifications needed" }) : null;
    }

    const {
      message,
      senderName,
      serviceTitle: reqServiceTitle,
      occasionTitle: reqOccasionTitle,
      notifyProvider,
      providerMessage,
      giftSender,
      deliveryDate,
      checkInDate,
      checkOutDate,
      nights,
      purchaseId: rawPurchaseId,
    } = req.body;

    const purchaseId = rawPurchaseId || req.body.purchase_id || null;

    const senderDisplayName = giftSender || senderName || "Anonymous";

    // Fetch service + provider + gift + occasion info from DB
    const [serviceRows] = await pool.query(
      `SELECT s.*,
       u.fullName AS providerName,
       u.email AS providerEmail,
       u.phone AS providerPhone,
       u.whatsapp AS providerWhatsApp,
       u.telegram AS providerTelegram,
       g.id AS giftId,
       g.occasion AS occasionName
FROM services s
JOIN users u ON s.providerId = u.id
LEFT JOIN gifts g ON g.service_id = s.id
WHERE s.id = ?


`,
      [serviceId]
    );

    const service = serviceRows[0];
    if (!service) return res.status(404).json({ msg: "Service not found" });

    const providerDisplayName = service.providerName || "—";
    const locationDisplay = service.location || "—";
    const occasionTitle = reqOccasionTitle || service.occasionName || "Special Gift";

    let effectiveDeliveryDate = deliveryDate && deliveryDate !== "null" && deliveryDate !== "undefined"
      ? deliveryDate
      : null;

    if (!effectiveDeliveryDate && purchaseId) {
      try {
        const [purchaseRows] = await pool.query(
          "SELECT deliveryDate FROM purchases WHERE id = ? LIMIT 1",
          [purchaseId]
        );
        if (purchaseRows.length && purchaseRows[0].deliveryDate) {
          effectiveDeliveryDate = purchaseRows[0].deliveryDate;
        }
      } catch (err) {
        console.error("❌ Failed to fetch delivery date for purchase:", purchaseId, err);
      }
    }

    const deliveryDateDisplay = formatDisplayDate(effectiveDeliveryDate);

    const hotelDetails =
      checkInDate && checkOutDate
        ? `🏨 Check-in: ${checkInDate}\n🏁 Check-out: ${checkOutDate}\n🛏️ Nights: ${nights}`
        : "";

    const finalMessage = `
🎁 You are receiving a gift from: ${senderDisplayName}

🎉 Occasion: ${occasionTitle}
🛍️ Service: ${reqServiceTitle || service.title || ""}
🏢 Service Provider: ${providerDisplayName}
📍 Location: ${locationDisplay}
📅 Delivery Date: ${deliveryDateDisplay || "N/A"}
💬 Message: ${message?.trim() || ""}
${hotelDetails ? "\n" + hotelDetails : ""}`.trim();

    // Collect rows for provider email summary
    const providerGiftRows = [];

    // Send notifications to each recipient and create gift_notifications records
    for (const recipient of recipients) {
      // Generate a unique gift code
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const giftCode = `GFT${timestamp}${random}`;
      const finalCode = giftCode.length > 10 ? giftCode.substring(0, 10) : giftCode;

      // Create gift_notifications record
      try {
        await pool.query(
          `INSERT INTO gift_notifications
          (gift_code, recipient_name, recipient_email, recipient_phone, recipient_whatsapp, recipient_telegram, recipient_photo,
           sender_name, occasion_name, service_id, provider_id, provider_name, service_location,
           message, delivery_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            finalCode,
            recipient.name || null,
            recipient.email || null,
            recipient.phone || null,
            recipient.whatsapp || null,
            recipient.telegram || null,
            recipient.photo || null,
            senderDisplayName,
            occasionTitle,
            serviceId,
            service.providerId,
            service.providerName,
            service.location || "N/A",
            message || null,
            "pending"
          ]
        );
        console.log("✅ Gift notification record created for", recipient.name, "with code:", finalCode);
      } catch (dbError) {
        console.error("❌ Database error creating gift notification:", dbError);
      }

      // Store for provider summary email
      providerGiftRows.push({
        name: recipient.name || "—",
        email: recipient.email || "—",
        phone: recipient.phone || recipient.whatsapp || "—",
        code: finalCode,
      });

      // Send notifications
      if (recipient.email)
        await sendEmail({
          to: recipient.email,
          subject: `You've received a thoughtful gift from ${senderDisplayName}!`,
          html: `<p>${finalMessage.replace(/\n/g, "<br>")}</p>`,
        });

      if (recipient.phone)
        await sendSMS({ to: formatNumber(recipient.phone), message: finalMessage });

      if (recipient.whatsapp)
        await sendWhatsApp({ to: formatNumber(recipient.whatsapp), message: finalMessage });

      if (recipient.telegram)
        await sendTelegram({ chatId: recipient.telegram, message: finalMessage });
    }

    // Optional: notify provider
    if (notifyProvider) {
    const providerNote = `
🔔 A customer just sent a gift using your service.

🎁 Gift Giver: ${senderDisplayName}
📝 Occasion: ${occasionTitle}
📍 Location: ${locationDisplay}
📅 Delivery Date: ${deliveryDateDisplay || "N/A"}
🛍️ Service: ${reqServiceTitle || service.title || "N/A"}
💬 Customer note: ${providerMessage || ""}
${hotelDetails ? "\n" + hotelDetails : ""}`.trim();

      const providerContact = {
        email: service.providerEmail,
        phone: service.providerPhone,
        whatsapp: service.providerWhatsApp,
        telegram: service.providerTelegram,
      };

      if (providerContact.email) {
        await sendEmail({
          to: providerContact.email,
          subject: "🔔 New Gift Order via Wanaw",
          html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin:auto; background: linear-gradient(to bottom right, #f7faff, #eef3f9); border-radius: 20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eee;">
          
          <!-- Header -->
          <div style="background-color:#1c2b21; padding: 24px; text-align:center;">
            <h2 style="margin:0; color:#D4AF37; font-size:22px; letter-spacing:1px;">
              Wanaw Gifting Solution
            </h2>
            <p style="margin:4px 0 0; font-size:14px; color:#f5f5f5;">Provider Notification</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px; color:#1c2b21;">
            <p style="font-size:16px; margin-bottom:16px;">Hello <strong>${providerDisplayName}</strong>,</p>
            <p style="font-size:15px; margin-bottom:20px; line-height:1.6;">
              You have received a new <span style="color:#D4AF37; font-weight:600;">gift order</span> via 
              <strong>Wanaw Gifting Solution</strong>. 🎉
            </p>

            <div style="background:#f0f6ff; border:2px dashed #1c2b21; border-radius:12px; padding:20px; text-align:left; margin-bottom:24px; font-size:14px; line-height:1.5;">
              <p style="margin:6px 0;"><strong>Gift Giver:</strong> ${senderDisplayName}</p>
              <p style="margin:6px 0;"><strong>Occasion:</strong> ${occasionTitle}</p>
              <p style="margin:6px 0;"><strong>Location:</strong> ${locationDisplay}</p>
              <p style="margin:6px 0;"><strong>Delivery Date:</strong> ${deliveryDateDisplay || "N/A"}</p>
              <p style="margin:6px 0;"><strong>Service:</strong> ${reqServiceTitle || service.title || "N/A"}</p>
              <p style="margin:6px 0;"><strong>Customer Note:</strong> ${providerMessage || "—"}</p>
              ${hotelDetails ? `<p style="margin:6px 0;">${hotelDetails.replace(/\n/g, "<br>")}</p>` : ""}
            </div>

            <div style="margin-bottom:24px;">
              <h3 style="margin:0 0 10px; font-size:16px;">Recipients & Gift Codes</h3>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                  <tr>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Recipient</th>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Email</th>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Phone</th>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Gift Code</th>
                  </tr>
                </thead>
                <tbody>
                  ${providerGiftRows.map(r => `
                    <tr>
                      <td style="border-bottom:1px solid #f0f0f0; padding:8px;">${r.name}</td>
                      <td style="border-bottom:1px solid #f0f0f0; padding:8px;">${r.email}</td>
                      <td style="border-bottom:1px solid #f0f0f0; padding:8px;">${r.phone}</td>
                      <td style="border-bottom:1px solid #f0f0f0; padding:8px; font-weight:600;">${r.code}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div style="text-align:center; margin-top:25px;">
              <a href="https://www.wanaw.et/" 
                 style="padding:14px 28px; background-color:#1c2b21; color:#fff; text-decoration:none; border-radius:30px; font-weight:bold; font-size:15px; display:inline-block;">
                View Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#fafafa; padding:16px; text-align:center; font-size:13px; color:#555;">
            <p style="margin:4px 0;"><strong>Wanaw Gifting Solution</strong></p>
            <p style="margin:4px 0;">📞 +251-989-177-777</p>
            <p style="margin:4px 0;">✉️ info@wanaw.com</p>
            <p style="margin:4px 0;">
              <a href="https://www.wanaw.et/" target="_blank" style="color:#D4AF37; text-decoration:none;">
                www.wanaw.et
              </a>
            </p>
          </div>
        </div>
      `,
          text: providerNote, // fallback plain text
        });
      }

      // keep SMS / WhatsApp / Telegram as they are
      if (providerContact.phone)
        await sendSMS({ to: formatNumber(providerContact.phone), message: providerNote });

      if (providerContact.whatsapp)
        await sendWhatsApp({ to: formatNumber(providerContact.whatsapp), message: providerNote });

      if (providerContact.telegram)
        await sendTelegram({ chatId: providerContact.telegram, message: providerNote });
    }

    return res.status(200).json({ success: true, recipients });

  } catch (error) {
    console.error("Notification error →", error);
    return res.status(500).json({ error: "Failed to send notifications." });
  }
};

// Simple provider availability reply via email
exports.sendProviderAvailabilityEmail = async (req, res) => {
  try {
    const { to, subject, message, providerName, serviceTitle, checkInDate, checkOutDate, nights } = req.body;
    if (!to) return res.status(400).json({ msg: "Recipient email (to) is required" });

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello,</p>
        <p>${providerName ? `<strong>${providerName}</strong> from Wanaw has responded regarding your hotel room availability request.` : `A provider on Wanaw has responded regarding your hotel room availability request.`}</p>
        ${serviceTitle ? `<p>Service: <strong>${serviceTitle}</strong></p>` : ""}
        ${(checkInDate && checkOutDate) ? `<p>Dates: <strong>${checkInDate}</strong> → <strong>${checkOutDate}</strong> ${nights ? `(Nights: ${nights})` : ""}</p>` : ""}
        <div style="margin:16px 0; padding:12px; border-left:4px solid #1c2b21; background:#f7f7f7;">${(message || "").replace(/\n/g, '<br/>')}</div>
        <p>Best regards,<br/>Wanaw Gifting Solution</p>
      </div>
    `;

    await sendEmail({ to, subject: subject || "Hotel Room Availability", html, text: message });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("sendProviderAvailabilityEmail error:", err);
    return res.status(500).json({ msg: "Failed to send email", error: err.message });
  }
};
