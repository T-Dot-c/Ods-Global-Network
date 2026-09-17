const { pool } = require("../config/db");
const { generateCertificateNumber } = require("../utils/certificateNumber");

let ensurePremiumSchemaPromise = null;

const ensurePremiumSchema = async () => {
  if (!ensurePremiumSchemaPromise) {
    ensurePremiumSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS premium_memberships (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          organization VARCHAR(255),
          roleTitle VARCHAR(255),
          notes TEXT,
          subscriptionPlan VARCHAR(100),
          subscriptionPrice VARCHAR(20),
          subscriptionCadence VARCHAR(20),
          isRenewal ENUM('yes', 'no') DEFAULT 'no',
          certificateNumber VARCHAR(4) UNIQUE,
          certificateIssuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          renewalHistory JSON NULL,
          paymentStatus ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
          paymentDate DATETIME NULL,
          paymentReference VARCHAR(255) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_certificate (certificateNumber),
          INDEX idx_payment_status (paymentStatus)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    })();
  }

  return ensurePremiumSchemaPromise;
};

exports.createPremiumMember = async (req, res) => {
  try {
    await ensurePremiumSchema();

    const {
      fullName,
      name,
      email,
      phone = null,
      organization = null,
      role: roleTitle = null,
      notes = null,
      subscriptionPlan = null,
      subscriptionPrice = null,
      subscriptionCadence = null,
      isRenewal = "no",
      currentCertificate = "",
    } = req.body || {};

    const memberName = (fullName || name || "").trim();
    const normalizedEmail = (email || "").trim();
    const normalizedRenewalFlag = String(isRenewal || "no").trim().toLowerCase();
    const sanitizedCertificate = String(currentCertificate || "").trim();

    if (!memberName || !normalizedEmail) {
      return res.status(400).json({ message: "Full name and email are required." });
    }

    if (!subscriptionPlan || !subscriptionPrice || !subscriptionCadence) {
      return res.status(400).json({
        message: "Subscription plan, price, and cadence are required for premium memberships.",
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (normalizedRenewalFlag === "yes" && sanitizedCertificate) {
        const [[existingMember]] = await connection.query(
          `SELECT id FROM premium_memberships WHERE certificateNumber = ?`,
          [sanitizedCertificate]
        );

        if (existingMember) {
          await connection.query(
            `UPDATE premium_memberships
               SET phone = ?,
                   organization = ?,
                   roleTitle = ?,
                   notes = ?,
                   subscriptionPlan = ?,
                   subscriptionPrice = ?,
                   subscriptionCadence = ?,
                   isRenewal = 'yes',
                   certificateIssuedAt = NOW(),
                   renewalHistory = JSON_ARRAY_APPEND(
                     COALESCE(renewalHistory, JSON_ARRAY()),
                     '$',
                     JSON_OBJECT(
                       'renewedAt', NOW(),
                       'subscriptionPlan', ?,
                       'subscriptionPrice', ?,
                       'subscriptionCadence', ?,
                       'submittedBy', ?
                     )
                   )
             WHERE id = ?`,
            [
              phone,
              organization,
              roleTitle,
              notes,
              subscriptionPlan,
              subscriptionPrice,
              subscriptionCadence,
              subscriptionPlan,
              subscriptionPrice,
              subscriptionCadence,
              normalizedEmail,
              existingMember.id,
            ]
          );

          const [[renewedMember]] = await connection.query(
            `SELECT id FROM premium_memberships WHERE id = ?`,
            [existingMember.id]
          );

          await connection.commit();

          return res.status(200).json({
            message: "Premium membership renewed successfully!",
            certificateNumber: sanitizedCertificate,
            membershipId: renewedMember.id,
            renewed: true,
          });
        }
      }

      const certificateNumber = await generateCertificateNumber(connection);

      const [insertResult] = await connection.query(
        `INSERT INTO premium_memberships
          (name, email, phone, organization, roleTitle, notes, subscriptionPlan, subscriptionPrice, subscriptionCadence, isRenewal, certificateNumber, renewalHistory)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_ARRAY(
           JSON_OBJECT(
             'createdAt', NOW(),
             'subscriptionPlan', ?,
             'subscriptionPrice', ?,
             'subscriptionCadence', ?,
             'submittedBy', ?
           )
         ))`,
        [
          memberName,
          normalizedEmail,
          phone,
          organization,
          roleTitle,
          notes,
          subscriptionPlan,
          subscriptionPrice,
          subscriptionCadence,
          normalizedRenewalFlag === "yes" ? "yes" : "no",
          certificateNumber,
          subscriptionPlan,
          subscriptionPrice,
          subscriptionCadence,
          normalizedEmail,
        ]
      );

      const membershipId = insertResult.insertId;

      await connection.commit();

      res.status(201).json({
        message: "Premium membership submitted successfully!",
        certificateNumber,
        membershipId,
        renewed: false,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Error submitting premium membership:", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPremiumMembers = async (_req, res) => {
  try {
    await ensurePremiumSchema();

    const [members] = await pool.query(
      `SELECT *
       FROM premium_memberships
       ORDER BY certificateIssuedAt DESC, id DESC`
    );

    res.status(200).json(members);
  } catch (error) {
    console.error("❌ Error fetching premium memberships:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




