const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");
const { sendMultiChannel, sendEmail } = require("../utils/notification");

// Role & membership options
const allowedRoles = ["individual", "provider", "corporate", "diaspora", "admin", "super_admin", "marketing_admin", "customer_support_admin", "standard_agent", "elite_agent"];
const providerRoles = ["provider", "corporate"];
const agentRoles = ["standard_agent", "elite_agent"];
const membershipOptions = {
  individual: ["Standard Member", "Gold Member", "Platinum Member"],
  diaspora: ["Standard Member", "Gold Member", "Platinum Member"],
  corporate: ["Standard Member", "Gold Member", "Platinum Member"],
  provider: ["Basic Provider", "Premium Provider"],
  standard_agent: ["Standard Agent"],
  elite_agent: ["Elite Agent"],
};

// Membership & referral generators
const generateMembershipId = () => `MEM${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-6)}`;
const generateReferralCode = () => {
  // Generate an 8-digit numeric referral code
  const min = 10000000;
  const max = 99999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// ---------------- File Upload Helper - Returns local path ----------------
const uploadFile = async (file) => {
  try {
    if (!file) {
      console.log("📁 uploadFile: No file provided, returning null");
      return null;
    }
    if (!file.filename) {
      console.log("📁 uploadFile: No filename, returning null");
      return null;
    }
    // Return the path relative to server root for database storage
    // Frontend will access it via /uploads/<filename>
    const result = `/uploads/${file.filename}`;
    console.log("📁 uploadFile: Successfully processed file:", result);
    return result;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
};

// ---------------- Register Controller ----------------
exports.register = async (req, res) => {
  try {
    console.log("🚀 Registration attempt started");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("🔍 Membership debug:", {
      role: req.body.role,
      membership: req.body.membership,
      membershipType: typeof req.body.membership
    });
    console.log("🔍 Referral debug:", {
      referralCode: req.body.referralCode,
      referredBy: req.body.referredBy,
      allKeys: Object.keys(req.body)
    });
    
    const {
      fullName,
      email,
      password,
      role = "individual",
      membership: reqMembership,
      companyName,
      serviceType,
      phone,
      whatsapp,
      telegram,
      city,
      location,
      tin,
      branches,
      banks,
      businessStatus
      // referralCodeUsed removed - not needed for now
    } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      console.log("❌ Missing required fields:", { email: !!email, password: !!password, fullName: !!fullName });
      return res.status(400).json({ msg: "Email, password, and full name are required" });
    }

    // Validate role
    if (!allowedRoles.includes(role)) {
      console.log("❌ Invalid role:", role);
      return res.status(400).json({ msg: `Invalid role: ${role}` });
    }

    // Check if user exists
    console.log("🔍 Checking if user exists for email:", email);
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log("❌ User already exists");
      return res.status(400).json({ msg: "User already exists" });
    }

    // Validate password
    if (!password || password.length < 6) {
      console.log("❌ Password validation failed");
      return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }

    // Provider-specific validation
    if (providerRoles.includes(role)) {
      if (!companyName || !serviceType) {
        return res.status(400).json({ msg: "Company name & service type are required" });
      }
      if (!city || !location) {
        return res.status(400).json({ msg: "City & location are required for providers" });
      }
      if (reqMembership && !membershipOptions[role].includes(reqMembership)) {
        console.log("❌ Invalid membership validation:", {
          role: role,
          receivedMembership: reqMembership,
          allowedMemberships: membershipOptions[role]
        });
        return res.status(400).json({ msg: `Invalid membership for role ${role}: ${reqMembership}. Allowed: ${membershipOptions[role].join(', ')}` });
      }
    }

    if (agentRoles.includes(role)) {
      if (reqMembership && !membershipOptions[role].includes(reqMembership)) {
        return res.status(400).json({
          msg: `Invalid membership for agent role. Allowed: ${membershipOptions[role].join(", ")}`,
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Membership & referral
    let membership = reqMembership || (providerRoles.includes(role) ? "Basic Provider" : "Standard Member");
    if (agentRoles.includes(role)) {
      membership = role === "elite_agent" ? "Elite Agent" : "Standard Agent";
    }
    const membershipId = generateMembershipId();
    const referralCode = generateReferralCode();

    // ---------------- File uploads ----------------
    console.log("📁 Processing file uploads...");
    let idFileUrl = null, licenseUrl = null, tradeRegUrl = null, videoUrl = null, priceListUrl = null, servicePhotosUrls = JSON.stringify([]);
    
    try {
      if (req.files) {
        console.log("📁 Files received:", Object.keys(req.files));
        
        // Handle both 'id' and 'idFile' field names for backward compatibility
        if (req.files.idFile?.length) {
          console.log("📁 Processing idFile");
          idFileUrl = await uploadFile(req.files.idFile[0]);
        } else if (req.files.id?.length) {
          console.log("📁 Processing id (fallback)");
          idFileUrl = await uploadFile(req.files.id[0]);
        }
        
        if (req.files.license?.length) {
          console.log("📁 Processing license");
          licenseUrl = await uploadFile(req.files.license[0]);
        }
        
        if (req.files.tradeRegistration?.length) {
          console.log("📁 Processing tradeRegistration");
          tradeRegUrl = await uploadFile(req.files.tradeRegistration[0]);
        }
        
        if (req.files.video?.length) {
          console.log("📁 Processing video");
          videoUrl = await uploadFile(req.files.video[0]);
        }
        
        if (req.files.priceList?.length) {
          console.log("📁 Processing priceList");
          priceListUrl = await uploadFile(req.files.priceList[0]);
        }
        
        if (req.files.servicePhotos?.length) {
          console.log("📁 Processing servicePhotos:", req.files.servicePhotos.length);
          const uploadedPhotos = [];
          for (const photo of req.files.servicePhotos) {
            const photoUrl = await uploadFile(photo);
            if (photoUrl) { // Only add if upload was successful
              uploadedPhotos.push(photoUrl);
            }
          }
          servicePhotosUrls = JSON.stringify(uploadedPhotos);
          console.log("📁 servicePhotosUrls after processing:", servicePhotosUrls);
        }
        // servicePhotosUrls is already initialized as JSON.stringify([]), so no need to set it again
      } else {
        console.log("📁 No files received");
      }
    } catch (uploadError) {
      console.error("❌ File upload failed:", uploadError);
      return res.status(500).json({ msg: "File upload failed: " + uploadError.message });
    }

    // ---------------- Referral handling ----------------
    // BULLETPROOF: Always set referredBy to null to prevent any errors
    let referredBy = null;
    console.log("🔧 BULLETPROOF: Setting referredBy to null to prevent database errors");

    // ---------------- Insert into DB ----------------
    let query = "";
    let values = [];
    
    // FINAL CHECK: Ensure referredBy is still null before database insertion
    console.log("🔧 FINAL CHECK - referredBy value:", referredBy, "type:", typeof referredBy);
    if (referredBy !== null) {
      console.log("🚨 WARNING: referredBy is not null! Setting to null to prevent database error");
      referredBy = null;
    }

    if (role === "individual" || role === "diaspora" || agentRoles.includes(role)) {
      query = `
        INSERT INTO users
          (fullName, email, password, role, referralCode, referralClicks, membership, membershipId, phone, whatsapp, telegram, idFile, referredBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        fullName, 
        email, 
        hashedPassword, 
        role, 
        referralCode,
        0,  // referralClicks
        membership, 
        membershipId, 
        phone || null, 
        whatsapp || null, 
        telegram || null, 
        idFileUrl || null, 
        referredBy
      ];
    } else if (providerRoles.includes(role) || role === "corporate") {
      query = `
        INSERT INTO users
          (fullName, email, password, role, referralCode, referralClicks, membership, membershipId, companyName, serviceType, phone, whatsapp, telegram, city, location, tin, branches, banks, businessStatus, license, tradeRegistration, servicePhotos, video, priceList, idFile, referredBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        fullName, email, hashedPassword, role,
        referralCode,
        0,  // referralClicks
        membership, membershipId, companyName, serviceType, 
        phone || null, whatsapp || null, telegram || null, city, location,
        tin || null,
        typeof branches === 'string' ? branches : (branches ? JSON.stringify(branches) : JSON.stringify([])),
        typeof banks === 'string' ? banks : (banks ? JSON.stringify(banks) : JSON.stringify([])),
        typeof businessStatus === 'string' ? businessStatus : (businessStatus ? JSON.stringify(businessStatus) : JSON.stringify([])),
        licenseUrl, tradeRegUrl, servicePhotosUrls || JSON.stringify([]), videoUrl, priceListUrl,
        idFileUrl || null,
        referredBy
      ];
      
      console.log("🔍 JSON fields validation:", {
        branches: typeof branches === 'string' ? branches : (branches ? JSON.stringify(branches) : JSON.stringify([])),
        banks: typeof banks === 'string' ? banks : (banks ? JSON.stringify(banks) : JSON.stringify([])),
        businessStatus: typeof businessStatus === 'string' ? businessStatus : (businessStatus ? JSON.stringify(businessStatus) : JSON.stringify([])),
        servicePhotosUrls: servicePhotosUrls || JSON.stringify([])
      });
      
      console.log("🔍 Provider registration values debug:", {
        referralCode: referralCode,
        referredBy: referredBy,
        referralCodeType: typeof referralCode,
        referredByType: typeof referredBy
      });

    }

    // servicePhotosUrls is already guaranteed to be a valid JSON string
    console.log("🔍 Final servicePhotosUrls value:", servicePhotosUrls);
    console.log("🔍 servicePhotosUrls type:", typeof servicePhotosUrls);
    
    console.log("💾 Inserting user into database...");
    console.log("Query:", query);
    console.log("Values:", values);
    
    // CRITICAL DEBUG: Check each value in the values array
    console.log("🔍 CRITICAL DEBUG - Values array analysis:");
    values.forEach((value, index) => {
      console.log(`  [${index}]: ${value} (type: ${typeof value})`);
    });
    
    // Find servicePhotos position in the query
    const queryParts = query.match(/\(([^)]+)\)/g);
    if (queryParts && queryParts[0]) {
      const columns = queryParts[0].replace(/[()]/g, '').split(',').map(col => col.trim());
      const servicePhotosIndex = columns.findIndex(col => col === 'servicePhotos');
      if (servicePhotosIndex !== -1) {
        console.log(`🔍 servicePhotos is at index ${servicePhotosIndex} in values array`);
        console.log(`🔍 servicePhotos value: "${values[servicePhotosIndex]}"`);
        console.log(`🔍 servicePhotos type: ${typeof values[servicePhotosIndex]}`);
      }
    }
    
    // FINAL VALIDATION: Ensure servicePhotosUrls is absolutely correct
    console.log("🔧 FINAL VALIDATION - servicePhotosUrls:");
    console.log("  Raw value:", servicePhotosUrls);
    console.log("  Type:", typeof servicePhotosUrls);
    console.log("  Is null:", servicePhotosUrls === null);
    console.log("  Is undefined:", servicePhotosUrls === undefined);
    console.log("  Is empty string:", servicePhotosUrls === "");
    
    // Force it to be correct if it's not
    if (!servicePhotosUrls || servicePhotosUrls === null || servicePhotosUrls === undefined || servicePhotosUrls === "") {
      console.log("🔧 FORCING servicePhotosUrls to be correct!");
      servicePhotosUrls = JSON.stringify([]);
    }
    
    // Update the values array with the corrected value
    const servicePhotosIndex = values.findIndex((val, index) => {
      // Find the position by looking at the query structure
      const queryParts = query.match(/\(([^)]+)\)/g);
      if (queryParts && queryParts[0]) {
        const columns = queryParts[0].replace(/[()]/g, '').split(',').map(col => col.trim());
        return columns[index] === 'servicePhotos';
      }
      return false;
    });
    
    if (servicePhotosIndex !== -1) {
      console.log(`🔧 Updating values[${servicePhotosIndex}] with corrected servicePhotosUrls`);
      values[servicePhotosIndex] = servicePhotosUrls;
    }
    
    console.log("🔍 Data validation:", {
      fullName: fullName,
      email: email,
      role: role,
      membership: membership,
      companyName: companyName,
      serviceType: serviceType,
      city: city,
      location: location,
      branches: branches,
      banks: banks,
      businessStatus: businessStatus
    });
    
    let userId;
    try {
      const [result] = await pool.query(query, values);
      userId = result.insertId;
      
      console.log("✅ User created successfully with ID:", userId);
    } catch (dbError) {
      console.error("❌ Database insertion failed:", dbError);
      console.error("❌ Error details:", {
        code: dbError.code,
        errno: dbError.errno,
        sqlMessage: dbError.sqlMessage,
        sqlState: dbError.sqlState,
        sql: dbError.sql
      });
      console.error("❌ Query that failed:", query);
      console.error("❌ Values that failed:", values);
      return res.status(500).json({ msg: "Database error during registration: " + dbError.sqlMessage });
    }

    // ---------------- Send Welcome Email ----------------
    const subject = `Welcome to Wanaw Gifting Solution, ${fullName}!`;
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
  <div style="background-color:#1c2b21; padding:20px; text-align:center;">
    <h1 style="margin:0; color:#D4AF37; font-size:22px;">Welcome to Wanaw Gifting Solution</h1>
  </div>
  <div style="padding:5%; background-color:#fff;">
    <h2 style="color:#1c2b21; font-size:18px; margin:0 0 10px;">Hello, ${fullName} 👋</h2>
    <p style="font-size:15px; color:#333; margin:0 0 15px;">We’re excited to have you join the Wanaw community! Your account has been created successfully.</p>
    <div style="margin:20px 0; padding:12px; background-color:#f7f7f7; border-left:4px solid #D4AF37;">
      <p style="font-size:15px; color:#1c2b21; margin:0;">🎉 Your Membership Type:</p>
      <p style="font-size:18px; font-weight:bold; color:#D4AF37; margin:5px 0 0;">${membership}</p>
    </div>
    <div style="margin:15px 0; padding:12px; background-color:#f7f7f7; border-left:4px solid #D4AF37;">
      <p style="font-size:15px; color:#1c2b21; margin:0;">🔗 Membership ID:</p>
      <p style="font-size:20px; font-weight:bold; color:#D4AF37; margin:5px 0 0;">${membershipId}</p>
    </div>
    <div style="margin:15px 0; padding:12px; background-color:#f7f7f7; border-left:4px solid #D4AF37;">
      <p style="font-size:15px; color:#1c2b21; margin:0;">🌟 Referral Code:</p>
      <p style="font-size:18px; font-weight:bold; color:#D4AF37; margin:5px 0 0;">${referralCode}</p>
    </div>
    <p style="font-size:15px; color:#333; margin:0 0 15px;">You can now explore health & wellness services, connect with providers, and enjoy the benefits of being part of Wanaw.</p>
    <div style="text-align:center; margin:20px 0;">
      <a href="https://www.wanaw.et/"
         style="display:inline-block; padding:12px 20px; background-color:#D4AF37; color:#1c2b21; text-decoration:none; font-weight:bold; border-radius:4px; font-size:15px;">
        Go to Dashboard
      </a>
    </div>
    <p style="font-size:15px; color:#333; margin:0 0 15px;">If you need help, reply to this email or reach us anytime through our support channels.</p>
    <p style="font-size:15px; color:#333; margin:0;">With gratitude,<br/><strong>The Wanaw Team</strong></p>
  </div>
  <div style="background-color:#1c2b21; padding:12px; text-align:center; font-size:12px; color:#D4AF37;">
    &copy; ${new Date().getFullYear()} Wanaw Gifting Solution. All rights reserved.
  </div>
</div>`;

    const text = `Hello ${fullName} 👋

Welcome to Wanaw Gifting Solution!

Your account is active 🎉
- Membership: ${membership}
- Membership ID: ${membershipId}
- Referral Code: ${referralCode}

Start exploring here: https://www.wanaw.et/

With gratitude,
The Wanaw Team
`;

    try {
      const notifyResults = await sendMultiChannel({
        email,
        phone,
        whatsapp,
        telegram,
        subject,
        html,
        text
      });
      console.log("Notification results:", notifyResults);
    } catch (err) {
      console.error("Notification sending failed:", err);
      return res.status(500).json({ msg: "Registration successful, but failed to send notifications", error: err.message, userId });
    }
    res.status(201).json({ msg: "User registered successfully", userId });
  } catch (err) {
    console.error("❌ Registration failed:", err);
    console.error("Error stack:", err.stack);
    
    // Handle specific database errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: "Email already exists" });
    }
    
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ msg: "Database table not found. Please contact support." });
    }
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ msg: "Database connection failed. Please try again later." });
    }
    
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};




/* ─────────────────── LOGIN ─────────────────── */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: "1d" });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        membership: user.membership,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Login failed" });
  }
};


/* ─────────────────── createService helper (unchanged) ─────────────────── */
exports.createService = async (req, res) => {
  const user = req.user; // populated by auth middleware

  if (user.role !== "provider")
    return res.status(403).json({ msg: "Only service providers can create services" });

  const allowedMemberships = ["basic", "premium", "enterprise"];
  if (!allowedMemberships.includes(user.membership))
    return res.status(403).json({ msg: "Upgrade your membership to list services." });

  try {
    const { name, description, price } = req.body;

    const [result] = await pool.query(
      `INSERT INTO services (providerId, name, description, price) VALUES (?, ?, ?, ?)`,
      [user.id, name, description, price]
    );

    res.status(201).json({ id: result.insertId, providerId: user.id, name, description, price });
  } catch (err) {
    console.error("Create Service Error:", err);
    res.status(500).json({ msg: "Failed to create service" });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // ✅ Remove .promise() here
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ msg: "Email not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpire = Date.now() + 1000 * 60 * 15;

    await pool.query(
      "UPDATE users SET resetToken = ?, tokenExpire = ? WHERE id = ?",
      [token, tokenExpire, user.id]
    );

    // Determine frontend URL based on environment
    let frontendUrl;
    if (process.env.NODE_ENV === "production") {
      // Use environment variable or default to your production domain
      frontendUrl = (process.env.FRONTEND_URL || "https://www.wanaw.et").replace(/\/$/, "");
    } else {
      frontendUrl = "http://localhost:5173";
    }

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    console.log("🔑 Password reset link generated:", resetLink);

    await sendEmail({
      to: user.email,
      subject: "🔐 Reset Your Password - Wanaw Gifting Solution",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin:auto; background: linear-gradient(to bottom right, #fff8f0, #fff1e6); border-radius: 20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eee;">
          
          <!-- Header -->
          <div style="background-color:#1c2b21; padding: 24px; text-align:center;">
            <h2 style="margin:0; color:#D4AF37; font-size:22px; letter-spacing:1px;">
              Wanaw Gifting Solution
            </h2>
            <p style="margin:4px 0 0; font-size:14px; color:#f5f5f5;">Password Reset Request</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px; color:#1c2b21;">
            <p style="font-size:16px; margin-bottom:16px;">Hello <strong>${user.fullName || "there"}</strong>,</p>
            <p style="font-size:15px; margin-bottom:20px; line-height:1.6;">
              We received a request to reset your password for your <strong>Wanaw Gifting Solution</strong> account.
            </p>

            <div style="background:#fff4e6; border:2px dashed #D4AF37; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
              <p style="margin:0; font-size:14px; color:#D4AF37; font-weight:600;">🔐 Reset Your Password</p>
              <p style="margin:12px 0 0; font-size:14px; color:#1c2b21;">Click the button below to create a new password. This link will expire in <strong>15 minutes</strong>.</p>
            </div>

            <div style="text-align:center; margin-top:25px; margin-bottom:24px;">
              <a href="${resetLink}" 
                 style="padding:14px 28px; background-color:#D4AF37; color:#1c2b21; text-decoration:none; border-radius:30px; font-weight:bold; font-size:15px; display:inline-block;">
                Reset Password
              </a>
            </div>

            <div style="background:#f9f9f9; border-left:4px solid #D4AF37; padding:16px; border-radius:8px; margin-top:24px;">
              <p style="margin:0; font-size:13px; color:#666; line-height:1.5;">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately. Your password will not be changed unless you click the link above.
              </p>
            </div>

            <p style="font-size:13px; color:#666; margin-top:20px; line-height:1.5;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color:#D4AF37; word-break:break-all; font-size:12px;">${resetLink}</a>
            </p>
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
      text: `Hello ${user.fullName || "there"}!\n\nWe received a request to reset your password for your Wanaw Gifting Solution account.\n\nClick this link to reset your password (expires in 15 minutes):\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nWanaw Gifting Solution\n📞 +251-989-177-777\n✉️ info@wanaw.com\nwww.wanaw.et`
    });

    res.status(200).json({ msg: "Reset link sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE resetToken = ? AND tokenExpire > ?",
      [token, Date.now()]
    );
    const user = rows[0];
    if (!user) return res.status(400).json({ msg: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password = ?, resetToken = NULL, tokenExpire = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.status(200).json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.sendPromo = async (req, res) => {
  try {
    // Logic to send promo (e.g., via email or notifications)
    const { message, recipients } = req.body;

    // Dummy example
    console.log("Sending promo to:", recipients);
    console.log("Message:", message);

    res.status(200).json({ msg: "Promotion sent successfully." });
  } catch (err) {
    console.error("Promo Error:", err);
    res.status(500).json({ msg: "Failed to send promotion." });
  }
};
exports.resolveSupportIssue = async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ msg: "Issue resolved." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to resolve issue." });
  }
};

// Get a single user profile
exports.getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership, membershipId, companyName, serviceType, phone, whatsapp, telegram, city, location FROM users WHERE id = ?",
      [id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Get User Profile Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// auth.js or userController.js
exports.getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, fullName, email, role, membership, membershipId, companyName, serviceType, phone, whatsapp, telegram, city, location 
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Get Current User Profile Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// controllers/authController.js

// Update current user profile
exports.updateCurrentUserProfile = async (req, res) => {
  const userId = req.user.id;
  const updateData = { ...req.body };
  delete updateData.password;

  try {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) return res.status(400).json({ msg: "No data to update" });

    const setQuery = fields.map(f => `${f} = ?`).join(", ");

    await pool.query(`UPDATE users SET ${setQuery} WHERE id = ?`, [...values, userId]);

    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership, membershipId, companyName, serviceType, phone, whatsapp, telegram, city, location FROM users WHERE id = ?",
      [userId]
    );

    res.status(200).json({ msg: "Profile updated successfully", user: rows[0] });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ msg: "Server error while updating profile" });
  }
};
// Change password
exports.changePassword = async (req, res) => {
  const userId = req.user.id; // populated by auth middleware
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password || "");
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.status(200).json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ msg: "Failed to change password" });
  }
};
