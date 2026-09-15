const { pool } = require("../config/db"); // MySQL connection pool
const path = require("path");
const fs = require("fs");
const { generateCertificateNumber } = require("../utils/certificateNumber");

// Helper to save buffer to local file system
const saveFileFromBuffer = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadPath = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const sanitizedName = originalName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "");
      const filename = `${Date.now()}-${sanitizedName}`;
      const filePath = path.join(uploadPath, filename);

      fs.writeFileSync(filePath, fileBuffer);
      
      // Return absolute URL for production
      const baseUrl = process.env.BASE_URL || 'https://wanaw.et';
      resolve(`${baseUrl}/uploads/${filename}`);
    } catch (error) {
      reject(error);
    }
  });
};

let ensureCertificatePromise = null;

const assignCertificatesToExistingMembers = async () => {
  const [members] = await pool.query(
    `SELECT id FROM community_members
     WHERE certificateNumber IS NULL OR certificateNumber = ''
     ORDER BY id ASC`
  );

  for (const member of members) {
    const certificateNumber = await generateCertificateNumber();
    await pool.query(
      `UPDATE community_members
         SET certificateNumber = ?, certificateIssuedAt = COALESCE(certificateIssuedAt, NOW())
       WHERE id = ?`,
      [certificateNumber, member.id]
    );
  }
};

const ensureCertificateSchema = async () => {
  if (!ensureCertificatePromise) {
    ensureCertificatePromise = (async () => {
      try {
        const [certificateColumn] = await pool.query(
          `SHOW COLUMNS FROM community_members LIKE 'certificateNumber'`
        );

        if (!certificateColumn.length) {
          await pool.query(
            `ALTER TABLE community_members
               ADD COLUMN certificateNumber VARCHAR(4) UNIQUE`
          );
        }

        const [issuedAtColumn] = await pool.query(
          `SHOW COLUMNS FROM community_members LIKE 'certificateIssuedAt'`
        );

        if (!issuedAtColumn.length) {
          await pool.query(
            `ALTER TABLE community_members
               ADD COLUMN certificateIssuedAt DATETIME DEFAULT CURRENT_TIMESTAMP`
          );
        }

        const [planColumn] = await pool.query(
          `SHOW COLUMNS FROM community_members LIKE 'subscriptionPlan'`
        );

        if (!planColumn.length) {
          await pool.query(
            `ALTER TABLE community_members
               ADD COLUMN subscriptionPlan VARCHAR(100) NULL,
               ADD COLUMN subscriptionPrice VARCHAR(20) NULL,
               ADD COLUMN subscriptionCadence VARCHAR(20) NULL,
               ADD COLUMN renewalHistory JSON NULL`
          );
        }

        await assignCertificatesToExistingMembers();
      } catch (error) {
        ensureCertificatePromise = null;
        console.error("❌ Failed to ensure certificate schema:", error);
        throw error;
      }
    })();
  }

  return ensureCertificatePromise;
};

// Create new community member
exports.createMember = async (req, res) => {
  try {
    await ensureCertificateSchema();
    const {
      name,
      fullName,
      email,
      phone = null,
      whatsapp = null,
      location = null,
      specialization = null,
      memberType: memberTypeRaw = null,
      organization = null,
      role: roleTitle = null,
      notes = null,
    } = req.body;

    const rawMemberType = Array.isArray(memberTypeRaw)
      ? String(memberTypeRaw[0] || "")
      : String(memberTypeRaw || "");
    const normalizedMemberType = rawMemberType.trim().toLowerCase();

    if (normalizedMemberType === "wanaw-premium") {
      return res.status(400).json({
        message: "Please submit Wanaw Premium memberships via the dedicated premium endpoint.",
      });
    }

    const memberName = (name || fullName || "").trim();

    if (!memberName || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const files = req.files || {};
    const cvFile = files.cv?.[0];
    const credentialsFile = files.credentials?.[0];

    let cvUrl = null;
    let credentialsUrl = null;

    if (cvFile) {
      cvUrl = await saveFileFromBuffer(cvFile.buffer, cvFile.originalname);
    }

    if (credentialsFile) {
      credentialsUrl = await saveFileFromBuffer(credentialsFile.buffer, credentialsFile.originalname);
    }

    if (!cvUrl || !credentialsUrl) {
      console.warn("⚠️ Community submission missing documents", {
        normalizedMemberType,
        hasCv: Boolean(cvUrl),
        hasCredentials: Boolean(credentialsUrl),
      });
      return res.status(400).json({ message: "Both CV and Credentials are required." });
    }

    const certificateNumber = await generateCertificateNumber();

    const derivedSpecialization =
      specialization ||
      (roleTitle
        ? [`Role: ${roleTitle}`, notes ? `Notes: ${notes}` : null]
            .filter(Boolean)
            .join(" | ")
        : notes);
    const derivedLocation = location || organization || roleTitle || null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO community_members
          (name, email, phone, whatsapp, location, specialization, memberType, cvUrl, credentialsUrl, certificateNumber, subscriptionPlan, subscriptionPrice, subscriptionCadence, renewalHistory)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_ARRAY(
           JSON_OBJECT(
             'createdAt', NOW(),
             'submittedBy', ?,
             'subscriptionPlan', ?,
             'subscriptionPrice', ?,
             'subscriptionCadence', ?
           )
         ))`,
        [
          memberName,
          email,
          phone,
          whatsapp,
          derivedLocation,
          derivedSpecialization,
          normalizedMemberType || null,
          cvUrl,
          credentialsUrl,
          certificateNumber,
          null,
          null,
          null,
          email,
          null,
          null,
          null,
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: "Membership form submitted successfully!",
        memberId: result.insertId,
        certificateNumber,
        renewed: false,
      });
    } catch (txnError) {
      await connection.rollback();
      throw txnError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Error submitting membership form:", {
      error: error.message,
      stack: error.stack,
      body: req.body,
      files: Object.keys(req.files || {}),
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all community members
exports.getAllMembers = async (req, res) => {
  try {
    await ensureCertificateSchema();

    const [members] = await pool.query(
      `SELECT * FROM community_members
       ORDER BY certificateIssuedAt DESC, id DESC`
    );
    res.status(200).json(members);
  } catch (error) {
    console.error("❌ Error fetching community members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
