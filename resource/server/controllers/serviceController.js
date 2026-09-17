const { pool } = require("../config/db");
const { sendGiftNotifications } = require("./notificationController");
const sendGiftEmail = require("../services/emailService");
const jwt = require("jsonwebtoken");

/* ─────────────────────────────
   Helper: Ensure review table exists
───────────────────────────── */
const ensureReviewTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_service_user (service_id, user_id),
      INDEX idx_service (service_id),
      INDEX idx_user (user_id),
      CONSTRAINT fk_service_reviews_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      CONSTRAINT fk_service_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

/* ─────────────────────────────
   Helper: Get base URL for production
───────────────────────────── */
const getBaseUrl = (req) => {
  // Use environment variable if set (for production)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Check X-Forwarded-Proto header (when behind reverse proxy)
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
  const host = req.get('X-Forwarded-Host') || req.get('host') || 'localhost:5000';
  
  // Ensure HTTPS in production
  const finalProtocol = process.env.NODE_ENV === 'production' && protocol !== 'https' ? 'https' : protocol;
  
  return `${finalProtocol}://${host}`;
};

/* ─────────────────────────────
   Helper: Ensure services.isActive exists
────────────────────────────── */
let hasCheckedIsActiveColumn = false;
const ensureIsActiveColumn = async () => {
  if (hasCheckedIsActiveColumn) return;

  try {
    const [columns] = await pool.query(`SHOW COLUMNS FROM services LIKE 'isActive'`);
    if (!columns.length) {
      console.warn("⚠️ services.isActive column missing – adding it now");
      await pool.query(`ALTER TABLE services ADD COLUMN isActive TINYINT(1) DEFAULT 1`);
      await pool.query(`UPDATE services SET isActive = 1 WHERE isActive IS NULL`);
      console.log("✅ Added services.isActive column");
    }
    hasCheckedIsActiveColumn = true;
  } catch (err) {
    console.error("❌ Failed to ensure services.isActive column:", err.message);
  }
};

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
  
  const baseUrl = getBaseUrl(req);
  
  // Build full URL for relative paths (/uploads/...)
  if (imageUrl.startsWith('/uploads')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // Fallback: assume it's a filename
  return `${baseUrl}/uploads/${imageUrl}`;
};

exports.purchaseService = async (req, res) => {
  try {
    console.log("🛒 Starting purchase service...");
    console.log("📝 Request body:", req.body);
    console.log("📁 Request files:", req.files);
    
    // Test database connection
    try {
      await pool.query('SELECT 1');
      console.log("✅ Database connection is working");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return res.status(500).json({ msg: "Database connection failed", error: dbError.message });
    }
    
    const body = req.body || {};
    let { buyerName, buyerEmail, message, deliveryDate, occasionTitle } = body;
    let recipients = [];

    // 🔹 Parse recipients (JSON string or object array)
    if (req.body.recipients) {
      recipients = typeof req.body.recipients === "string"
        ? JSON.parse(req.body.recipients)
        : req.body.recipients;
    }

    console.log("👥 Recipients:", recipients);

    // 🔹 Validation
    if (!buyerName || !buyerEmail) {
      console.log("❌ Validation failed: Missing buyer info");
      return res.status(400).json({ msg: "Buyer name and email are required" });
    }
    if (!recipients.length) {
      console.log("❌ Validation failed: No recipients");
      return res.status(400).json({ msg: "At least one recipient is required" });
    }

    // 🔹 Attach uploaded photos to correct recipient
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/recipients\[(\d+)\]\[photo\]/);
        if (match) {
          const index = parseInt(match[1], 10);
          if (recipients[index]) {
            // Use Cloudinary URL if available, otherwise fallback to local path
            recipients[index].photo = file.cloudinaryUrl || file.path || `/uploads/${file.filename || file.originalname}`;
          }
        }
      });
    }

    // 1️⃣ Get service details
    console.log("🔍 Fetching service details for ID:", req.params.id);
    const [serviceRows] = await pool.query(
      `SELECT s.*, u.fullName AS providerName, u.email AS providerEmail 
       FROM services s 
       JOIN users u ON s.providerId = u.id 
       WHERE s.id = ?`,
      [req.params.id]
    );

    const service = serviceRows[0];
    if (!service) {
      console.log("❌ Service not found for ID:", req.params.id);
      return res.status(404).json({ msg: "Service not found" });
    }
    console.log("✅ Service found:", service.title);

    // 2️⃣ Get gift details (if linked)
    const [giftRows] = await pool.query(
      "SELECT * FROM gifts WHERE service_id = ? LIMIT 1",
      [service.id]
    );
    const gift = giftRows[0] || null;

    const parseNumber = (value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const rawServicePrice = parseNumber(service.price);
    const serviceDiscount = parseNumber(service.discount);
    const discountedServicePrice =
      serviceDiscount > 0 && serviceDiscount < 100
        ? rawServicePrice * (1 - serviceDiscount / 100)
        : rawServicePrice;

    const requestedNights = parseInt(body.nights, 10);
    const isHotelService =
      service.category &&
      ["Hotel", "Hotel Rooms"].includes(service.category);
    const nightsCount = isHotelService ? Math.max(1, requestedNights || 1) : 1;
    const baseUnitPrice = discountedServicePrice * nightsCount;

    const normalizeTier = (value) => {
      if (value === "vip" || value === "corporate") return value;
      return "standard";
    };

    recipients = recipients.map((recipient) => ({
      ...recipient,
      type: normalizeTier(recipient.type),
    }));

    const corporateCount = recipients.filter(
      (r) => r.type === "corporate"
    ).length;
    if (corporateCount > 0 && recipients.length < 10) {
      return res.status(400).json({
        msg: "Corporate gifts require at least 10 recipients. Please add more recipients or switch to Standard/VIP.",
      });
    }

    const getTierMultiplier = (type) => {
      if (type === "vip") return 1.15;
      if (type === "corporate") return 0.85;
      return 1;
    };

    let totalAmount = 0;
    recipients = recipients.map((recipient) => {
      const multiplier = getTierMultiplier(recipient.type);
      const recipientPrice = Number((baseUnitPrice * multiplier).toFixed(2));
      totalAmount += recipientPrice;
      return {
        ...recipient,
        calculatedPrice: recipientPrice,
      };
    });

    console.log("💰 Pricing summary:", {
      rawServicePrice,
      serviceDiscount,
      discountedServicePrice,
      nightsCount,
      baseUnitPrice,
      totalRecipients: recipients.length,
      totalAmount,
    });

    // 3️⃣ Insert purchase record
    console.log("💾 Inserting purchase record...");
    const [purchaseResult] = await pool.query(
        `INSERT INTO purchases 
          (itemType, itemId, providerId, buyerName, buyerEmail, total_amount, deliveryDate, extraInfo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "service",
          service.id,
          service.providerId,
          buyerName,
          buyerEmail,
        totalAmount,
          deliveryDate || null,
        JSON.stringify(recipients),
        ]
      );

    const purchaseId = purchaseResult.insertId;
    console.log("✅ Purchase record created with ID:", purchaseId);

    // 4️⃣ Generate gift codes & store recipient notifications
      console.log("🎁 Generating gift codes for", recipients.length, "recipients...");
    const codes = [];
      for (const recipient of recipients) {
      // Generate a shorter but still unique gift code
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const code = `GFT${timestamp}${random}`;
      
      // Ensure code is not too long for database (max 10 characters)
      const finalCode = code.length > 10 ? code.substring(0, 10) : code;
      codes.push(finalCode);
      recipient.giftCode = finalCode;

      console.log("🎫 Generated gift code for", recipient.name, ":", code);

      try {
        // Get occasion name from request, gift, or use a default
        const occasionName = occasionTitle || (gift ? gift.occasion : null) || "Special Gift";
        
        await pool.query(
          `INSERT INTO gift_notifications
      (purchase_id, gift_code, recipient_name, recipient_email, recipient_phone, recipient_whatsapp, recipient_telegram, recipient_photo, gift_id, occasion_id, occasion_name, delivery_status, provider_id, provider_name, service_id, service_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            purchaseId,
            finalCode,
          recipient.name || null,
          recipient.email || null,
          recipient.phone || null,
          recipient.whatsapp || null,
          recipient.telegram || null,
          recipient.photo || null,
            gift ? gift.id : null,
            gift ? gift.id : null, // occasion_id should be the gift ID or null
            occasionName, // occasion_name should be the actual occasion string
          "pending",
            service.providerId,
            service.providerName,
            service.id,
          service.location || "N/A"
          ]
        );
        console.log("✅ Gift notification stored for", recipient.name, "with occasion:", occasionName);
      } catch (dbError) {
        console.error("❌ Database error storing gift notification:", dbError);
        throw dbError;
      }


      // 🔹 Send recipient email immediately
      if (recipient.email) {
        console.log(`📧 Sending email to ${recipient.email} with gift code: ${code}`);
        try {
          await sendGiftEmail({
            to: recipient.email,
            subject: `🎁 You've received a gift from ${buyerName}`,
            html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin:auto; background: linear-gradient(to bottom right, #fff8f0, #fff1e6); border-radius: 20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eee;">
          
          <!-- Header -->
          <div style="background-color:#1c2b21; padding: 24px; text-align:center;">
            <h2 style="margin:0; color:#D4AF37; font-size:22px; letter-spacing:1px;">
              Wanaw Gifting Solution
            </h2>
            <p style="margin:4px 0 0; font-size:14px; color:#f5f5f5;">Digital Gift Card</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px; color:#1c2b21;">
            <p style="font-size:16px; margin-bottom:16px;">Hello <strong>${recipient.name || "there"}</strong>,</p>
            <p style="font-size:15px; margin-bottom:20px; line-height:1.6;">
              <strong>${buyerName}</strong> has sent you a <span style="color:#D4AF37; font-weight:600;">special gift</span> 
              through <strong>Wanaw Gifting Solution</strong>!
            </p>

            <div style="background:#fff4e6; border:2px dashed #D4AF37; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
              <p style="margin:0; font-size:14px; color:#D4AF37; font-weight:600;">🎉 Your Gift Code</p>
              <p style="margin:8px 0 0; font-size:26px; font-weight:bold; color:#1c2b21;">${finalCode}</p>
            </div>

            <ul style="list-style:none; padding:0; margin:0 0 20px;">
              <li><strong>Service:</strong> ${service.title}</li>
              <li><strong>Provider:</strong> ${service.providerName}</li>
              <li><strong>Location:</strong> ${service.location || "N/A"}</li>
              ${occasionTitle && occasionTitle !== "Not specified" ? `<li><strong>Occasion:</strong> ${occasionTitle}</li>` : ""}
            </ul>

            ${message ? `<p style="font-style:italic; color:#555; margin:16px 0;">"${message}"</p>` : ""}
            
            <div style="text-align:center; margin-top:25px;">
              <a href="https://www.wanaw.et/redeem" 
                 style="padding:14px 28px; background-color:#D4AF37; color:#1c2b21; text-decoration:none; border-radius:30px; font-weight:bold; font-size:15px; display:inline-block;">
                Redeem Your Gift
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
            text: `Hello ${recipient.name || "there"}!\nFrom: ${buyerName}\nService: ${service.title}\nGift Code: ${finalCode}\nMessage: ${message || "No message"}\nRedeem at: https://www.wanaw.et/redeem`
          });
        } catch (err) {
          console.error("❌ Failed to send gift email:", err);
        }
      } else {
        console.log(`⚠️ No email provided for recipient: ${recipient.name}`);
      }
    }

    // 5️⃣ Use notificationController to notify both recipients & provider
      await sendGiftNotifications(
        {
          body: {
            serviceId: service.id,
            senderName: buyerName,
            serviceTitle: service.title,
            occasionTitle, // ensure real occasion passed through
            providerMessage: `Purchase by ${buyerName} (${buyerEmail})`,
            deliveryDate,
            purchaseId,
            notifyProvider: true,
            recipients, // 🔥 FIX: pass recipients here
          },
          params: { id: service.id }
        },
        { status: () => ({ json: () => { } }) } // mock res
      );

    console.log('🎁 Backend generated gift codes:', codes);
    res.status(201).json({
      msg: "✅ Purchase recorded, recipients + provider notified",
      purchaseId,
      codes,
      totalAmount
    });

  } catch (err) {
    console.error("❌ Purchase error:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      msg: "Purchase failed", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


// Utility to normalize category
function normalizeCategory(category) {
  const validCategories = ["Wellness", "Medical", "Home Based/Mobile Services", "Hotel"];
  return validCategories.includes(category) ? category : null;
}
/* ───────────── Create Service ───────────── */
exports.createService = async (req, res) => {
  try {
    // 1️⃣ Check JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure JWT_SECRET is in your .env
    } catch (err) {
      return res.status(401).json({ msg: "Invalid token" });
    }

    const providerId = decoded.id; // assume your token contains user ID

    // 2️⃣ Normalize category
    const normalizedCategory = normalizeCategory(req.body.category);
    if (!normalizedCategory) {
      return res.status(400).json({ msg: "Invalid or missing category" });
    }

    // 3️⃣ Prepare other fields, and store relative path in database
    // If imageUrl is provided (full URL from upload endpoint), extract relative path
    let imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || "";
    
    // If imageUrl is a full URL, convert to relative path for database storage
    if (imageUrl && imageUrl.startsWith('http')) {
      // Extract the path portion (e.g., /uploads/filename.jpg)
      try {
        const urlObj = new URL(imageUrl);
        imageUrl = urlObj.pathname; // This gives us /uploads/filename.jpg
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        const match = imageUrl.match(/\/uploads\/[^\/]+$/);
        if (match) {
          imageUrl = match[0];
        }
      }
    }
    
    // Ensure imageUrl starts with /uploads/ if it doesn't already
    if (imageUrl && !imageUrl.startsWith('/uploads') && !imageUrl.startsWith('http')) {
      imageUrl = `/uploads/${imageUrl}`;
    }
    
    const {
      title,
      description,
      price,
      location,
      subcategory,
      duration,
      tags,
    } = req.body;

    // 4️⃣ Insert into MySQL
    // 4️⃣ Insert into MySQL
    const [result] = await pool.query(
      `INSERT INTO services 
    (title, description, category, subcategory, price, duration, tags, location, imageUrl, providerId, status, rating, isActive)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        normalizedCategory,
        subcategory || null,
        price,
        duration || null,
        JSON.stringify(tags || []),
        location || null,
        imageUrl,
        providerId,
        "pending",
        0.0,
        1
      ]
    );

    // 5️⃣ Fetch newly created service
    const [newService] = await pool.query(
      "SELECT * FROM services WHERE id = ?",
      [result.insertId]
    );


    res.status(201).json({ msg: "✅ Service created successfully", service: newService[0] });
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({ msg: "Failed to create service", error: err.message });
  }
};


/* ───────────── Get Services for a Provider (own list) ───────────── */
exports.getProviderServices = async (req, res) => {
  try {
    await ensureIsActiveColumn();

    const { providerId } = req.params;
    const requestingUserId = req.user?.id;

    if (!requestingUserId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const requestingId = Number(requestingUserId);
    const providerIdNum = Number(providerId);

    if (
      Number.isNaN(requestingId) ||
      Number.isNaN(providerIdNum) ||
      requestingId !== providerIdNum
    ) {
      return res.status(403).json({
        msg: "Access denied. You can only view your own services.",
      });
    }

    const [services] = await pool.query(
      `SELECT
         id,
         title,
         description,
         category,
         subcategory,
         price,
         discount,
         imageUrl,
         location,
         status,
         rating,
         reviewCount,
         providerId,
         duration,
         isActive,
         createdAt
       FROM services
       WHERE providerId = ?
       ORDER BY createdAt DESC`,
      [providerIdNum]
    );

    const toNumberOrNull = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const formatted = services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description ?? null,
      category: service.category,
      subcategory: service.subcategory ?? null,
      price: toNumberOrNull(service.price),
      discount: toNumberOrNull(service.discount) ?? 0,
      imageUrl: fixImageUrl(service.imageUrl, req),
      location: service.location ?? null,
      status: service.status || "pending",
      rating: toNumberOrNull(service.rating) ?? 0,
      reviewCount: toNumberOrNull(service.reviewCount) ?? 0,
      providerId: service.providerId,
      duration: service.duration ?? null,
      isActive: service.isActive,
      createdAt: service.createdAt,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ ERROR in getProviderServices:", err);
    return res.status(500).json({
      msg: "Server error fetching services",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
};

/* ───────────── Get All Services ───────────── */
exports.getAllServices = async (req, res) => {
  try {
    await ensureIsActiveColumn();

    const { category, subcategory } = req.query;

    let sql = `
      SELECT s.*, u.fullName AS providerName, u.email AS providerEmail
      FROM services s
      LEFT JOIN users u ON s.providerId = u.id
    `;
    const params = [];

    if (category) {
      const normalizedCategory = normalizeCategory(category);
      if (normalizedCategory) {
        sql += " WHERE s.category = ?";
        params.push(normalizedCategory);
      }
    }

    if (subcategory) {
      sql += params.length ? " AND" : " WHERE";
      sql += " s.subcategory LIKE ?";
      params.push(`%${subcategory}%`);
    }

    const [services] = await pool.query(sql, params);

    // Normalize image URLs for frontend consumption
    const buildServiceImageUrl = (rawUrl) => {
      if (!rawUrl) return null;
      if (typeof rawUrl !== "string") return null;
      
      // If it's already a full URL, normalize it
      if (rawUrl.startsWith("http")) {
        // Convert http:// to https:// in production
        if (process.env.NODE_ENV === 'production' && rawUrl.startsWith('http://')) {
          return rawUrl.replace('http://', 'https://');
        }
        // If it's a full URL but has wrong domain, extract path and rebuild
        try {
          const urlObj = new URL(rawUrl);
          // If the path is /uploads/..., rebuild with current domain
          if (urlObj.pathname.startsWith('/uploads')) {
            const baseUrl = getBaseUrl(req);
            return `${baseUrl}${urlObj.pathname}`;
          }
        } catch (e) {
          // URL parsing failed, use as is
        }
        return rawUrl;
      }
      
      // It's a relative path - build full URL
      const baseUrl = getBaseUrl(req);
      if (rawUrl.startsWith("/uploads")) {
        return `${baseUrl}${rawUrl}`;
      }
      // Fallback: assume it's a filename without leading slash
      return `${baseUrl}/uploads/${rawUrl}`;
    };

    const formatted = services.map((s) => ({
        ...s,
        imageUrl: buildServiceImageUrl(s.imageUrl),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Fetch services error:", err);
    res.status(500).json({ msg: "Error fetching services", error: err.message });
  }
};

/* ───────────── Get Service by ID ───────────── */
exports.getServiceById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: "Service not found" });

    const buildServiceImageUrl = (rawUrl) => {
        if (!rawUrl) return null;
        if (typeof rawUrl !== "string") return null;
        
      // If it's already a full URL, normalize it
        if (rawUrl.startsWith("http")) {
        // Convert http:// to https:// in production
        if (process.env.NODE_ENV === 'production' && rawUrl.startsWith('http://')) {
          return rawUrl.replace('http://', 'https://');
        }
        // If it's a full URL but has wrong domain, extract path and rebuild
        try {
          const urlObj = new URL(rawUrl);
          // If the path is /uploads/..., rebuild with current domain
          if (urlObj.pathname.startsWith('/uploads')) {
            const baseUrl = getBaseUrl(req);
            return `${baseUrl}${urlObj.pathname}`;
          }
        } catch (e) {
          // URL parsing failed, use as is
          }
          return rawUrl;
        }
        
      // It's a relative path - build full URL
      const baseUrl = getBaseUrl(req);
        if (rawUrl.startsWith("/uploads")) {
          return `${baseUrl}${rawUrl}`;
        }
      // Fallback: assume it's a filename without leading slash
        return `${baseUrl}/uploads/${rawUrl}`;
    };

    const service = rows[0];
    service.imageUrl = buildServiceImageUrl(service.imageUrl);
    res.status(200).json(service);
  } catch (err) {
    console.error("Get service error:", err);
    res.status(500).json({ msg: "Error fetching service", error: err.message });
  }
};

/* ───────────── Service Reviews ───────────── */
exports.getServiceReviews = async (req, res) => {
  const { id } = req.params;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ msg: "Invalid service id" });
  }

  try {
    await ensureReviewTable();

    const [serviceRows] = await pool.query("SELECT id FROM services WHERE id = ?", [id]);
    if (!serviceRows.length) {
      return res.status(404).json({ msg: "Service not found" });
    }

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at AS createdAt, r.updated_at AS updatedAt,
              r.user_id AS reviewerId,
              u.fullName AS reviewerName
         FROM service_reviews r
         JOIN users u ON r.user_id = u.id
        WHERE r.service_id = ?
        ORDER BY r.created_at DESC`,
      [id]
    );

    const [[summary]] = await pool.query(
      `SELECT AVG(rating) AS averageRating, COUNT(*) AS totalReviews
         FROM service_reviews
        WHERE service_id = ?`,
      [id]
    );

    const averageRating = summary?.averageRating ? Math.round(Number(summary.averageRating) * 10) / 10 : 0;
    const totalReviews = summary?.totalReviews ? Number(summary.totalReviews) : 0;

    res.json({
      success: true,
      averageRating,
      totalReviews,
      reviews: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching service reviews:", error);
    res.status(500).json({ msg: "Failed to load reviews", error: error.message });
  }
};

exports.addServiceReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { rating, comment } = req.body || {};

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ msg: "Invalid service id" });
  }

  if (!userId) {
    return res.status(401).json({ msg: "Authentication required" });
  }

  const ratingValue = Number(rating);
  if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
    return res.status(400).json({ msg: "Rating must be between 1 and 5" });
  }

  const trimmedComment = comment ? String(comment).trim() : null;

  try {
    await ensureReviewTable();

    const [serviceRows] = await pool.query("SELECT id FROM services WHERE id = ?", [id]);
    if (!serviceRows.length) {
      return res.status(404).json({ msg: "Service not found" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM service_reviews WHERE service_id = ? AND user_id = ?",
      [id, userId]
    );

    let reviewId;
    let message;

    if (existing.length) {
      reviewId = existing[0].id;
      await pool.query(
        "UPDATE service_reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [ratingValue, trimmedComment, reviewId]
      );
      message = "Review updated";
    } else {
      const [result] = await pool.query(
        "INSERT INTO service_reviews (service_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [id, userId, ratingValue, trimmedComment]
      );
      reviewId = result.insertId;
      message = "Review submitted";
    }

    const [[reviewRow]] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at AS createdAt, r.updated_at AS updatedAt,
              r.user_id AS reviewerId,
              u.fullName AS reviewerName
         FROM service_reviews r
         JOIN users u ON r.user_id = u.id
        WHERE r.id = ?`,
      [reviewId]
    );

    const [[summary]] = await pool.query(
      `SELECT AVG(rating) AS averageRating, COUNT(*) AS totalReviews
         FROM service_reviews
        WHERE service_id = ?`,
      [id]
    );

    const averageRating = summary?.averageRating ? Math.round(Number(summary.averageRating) * 10) / 10 : 0;
    const totalReviews = summary?.totalReviews ? Number(summary.totalReviews) : 0;

    await pool.query("UPDATE services SET rating = ? WHERE id = ?", [averageRating, id]);

    res.json({
      success: true,
      msg: message,
      averageRating,
      totalReviews,
      review: reviewRow,
    });
  } catch (error) {
    console.error("❌ Error saving service review:", error);
    res.status(500).json({ msg: "Failed to submit review", error: error.message });
  }
};

/* ───────────── Delete Service ───────────── */
exports.deleteService = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: "Service not found" });

    await pool.query("DELETE FROM services WHERE id = ?", [req.params.id]);
    res.json({ msg: "🗑️ Service deleted" });
  } catch (err) {
    console.error("Delete service error:", err);
    res.status(500).json({ msg: "Error deleting service", error: err.message });
  }
};

/* ───────────── Update Service Status ───────────── */
exports.updateServiceStatus = async (req, res) => {
  const { status } = req.body;
  if (!["approved", "denied"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status. Must be 'approved' or 'denied'" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: "Service not found" });

    await pool.query("UPDATE services SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ msg: `Service ${status}` });
  } catch (err) {
    console.error("Update service status error:", err);
    res.status(500).json({ msg: "Failed to update service status", error: err.message });
  }
};

/* ───────────── Get Subcategories ───────────── */
exports.getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ msg: "Category is required" });

    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) return res.status(400).json({ msg: "Invalid category" });

    const [rows] = await pool.query(
      "SELECT DISTINCT subcategory FROM services WHERE category = ?",
      [normalizedCategory]
    );

    res.json(rows.map(r => r.subcategory).filter(Boolean));
  } catch (err) {
    console.error("Get subcategories error:", err);
    res.status(500).json({ msg: "Failed to fetch subcategories", error: err.message });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    // 1️⃣ Fetch purchases with service and provider info
    const [purchases] = await pool.query(`
      SELECT p.id AS purchaseId, p.itemType, p.buyerName, p.buyerEmail, p.total_amount AS amount,
             p.deliveryDate, p.created_at AS purchaseDate,
             s.id AS serviceId, s.title AS serviceTitle, s.category AS serviceCategory, s.location AS serviceLocation,
             u.id AS providerId, u.fullName AS providerName, u.email AS providerEmail,
             p.extraInfo
      FROM purchases p
      JOIN services s ON p.itemId = s.id
      JOIN users u ON p.providerId = u.id
      WHERE p.itemType = 'service'
    `);

    if (!purchases.length) return res.json([]);

    const purchaseIds = purchases.map(p => p.purchaseId);

    // 2️⃣ Fetch gift notifications
    const [giftNotifications] = await pool.query(`
      SELECT * 
      FROM gift_notifications 
      WHERE purchase_id IN (?)
    `, [purchaseIds]);

    // 3️⃣ Map gifts to purchases and merge recipient info
    const result = purchases.map(purchase => {
      // Parse extraInfo JSON if exists
      let extraRecipients = [];
      if (purchase.extraInfo) {
        try {
          extraRecipients = typeof purchase.extraInfo === "string"
            ? JSON.parse(purchase.extraInfo)
            : purchase.extraInfo;
        } catch (err) {
          console.error("❌ Failed to parse purchase extraInfo JSON:", err);
        }
      }

      // Filter gift notifications for this purchase
      const gifts = giftNotifications
        .filter(g => g.purchase_id === purchase.purchaseId)
        .map(g => {
          // Merge DB columns and extraInfo fallback
          let extraRecipient = extraRecipients.find(r => r.giftCode === g.gift_code) || extraRecipients[0] || {};
          const recipient = {
            name: g.recipient_name || extraRecipient.name || "there",
            email: g.recipient_email || extraRecipient.email || "",
            phone: g.recipient_phone || extraRecipient.phone || "",
            whatsapp: g.recipient_whatsapp || extraRecipient.whatsapp || "",
            telegram: g.recipient_telegram || extraRecipient.telegram || "",
            photo: fixImageUrl(g.recipient_photo || extraRecipient.photo, req),
          };

          return {
            giftCode: g.gift_code || "N/A",
            deliveryStatus: g.delivery_status || "pending",
            occasion: g.occasion_name || "Not specified",
            recipient,
          };
        });

      return {
        id: purchase.purchaseId,
        itemType: purchase.itemType,
        service: {
          id: purchase.serviceId,
          title: purchase.serviceTitle || "Untitled",
          category: purchase.serviceCategory,
          location: purchase.serviceLocation,
        },
        provider: {
          id: purchase.providerId,
          fullName: purchase.providerName,
          email: purchase.providerEmail,
        },
        buyerName: purchase.buyerName,
        buyerEmail: purchase.buyerEmail,
        amount: purchase.amount,
        deliveryDate: purchase.deliveryDate,
        purchaseDate: purchase.purchaseDate,
        gifts,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Failed to fetch purchases:", err);
    res.status(500).json({ msg: "Failed to fetch purchases", error: err.message });
  }
};

/* ─────────────────────────────
   Get Gift Codes by Purchase ID
───────────────────────────── */
exports.getGiftCodesByPurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    
    if (!purchaseId) {
      return res.status(400).json({ msg: "Purchase ID is required" });
    }

    // Fetch gift notifications for this purchase
    const [giftNotifications] = await pool.query(
      `SELECT 
        gn.id,
        gn.gift_code,
        gn.recipient_name,
        gn.occasion_name,
        gn.delivery_status,
        gn.created_at,
        gn.provider_name,
        gn.service_location,
        s.title AS service_title,
        s.category AS service_category,
        s.price,
        s.location AS service_location
      FROM gift_notifications gn
      LEFT JOIN services s ON gn.service_id = s.id
      WHERE gn.purchase_id = ?
      ORDER BY gn.created_at DESC`,
      [purchaseId]
    );

    res.status(200).json({
      success: true,
      gifts: giftNotifications
    });

  } catch (err) {
    console.error("❌ Error fetching gift codes:", err);
    res.status(500).json({ msg: "Failed to fetch gift codes", error: err.message });
  }
};







