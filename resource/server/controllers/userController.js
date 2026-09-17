// controllers/userController.js
const { pool } = require("../config/db");

exports.getAllUsers = async (req, res) => {
  try {
    console.log("===== /all-users called =====");
    console.log("Authenticated user from verifyToken:", req.user);

    const { role } = req.query;
    console.log("Role filter received from query params:", role);

    let query = `
      SELECT
        id,
        fullName,
        email,
        role,
        membership,
        membershipId,
        companyName,
        serviceType,
        phone,
        whatsapp,
        telegram,
        city,
        location,
        license,
        tradeRegistration,
        idFile,
        servicePhotos,
        video,
        priceList,
        referralCode,
        referralClicks,
        createdAt,
        updatedAt
      FROM users
    `;

    const params = [];
    if (role) {
      console.log(`Filtering users by role: ${role}`);
      query += " WHERE role = ?";
      params.push(role);
    }

    console.log("Executing query:", query);
    console.log("Query params:", params);

    const [users] = await pool.query(query, params);
    console.log("Users fetched from DB:", users.length);

    // Normalize files and parse JSON fields
    const formattedUsers = users.map(u => {
      let photos = [];
      try {
        photos = JSON.parse(u.servicePhotos || "[]");
        if (typeof photos === "string") photos = [photos];
      } catch {
        if (u.servicePhotos) photos = [u.servicePhotos];
      }

      return {
        ...u,
        licenseUrl: u.license || null,
        tradeRegUrl: u.tradeRegistration || null,
        idFileUrl: u.idFile || null,          // ← ID file included
        photoUrls: photos,                    // array of service photos
        videoUrl: u.video || null,
        priceListUrl: u.priceList || null
      };
    });

    if (formattedUsers.length > 0) {
      console.log("First user:", formattedUsers[0]);
    }

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};




// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Dynamically build SET clause
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const [result] = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ msg: "User not found" });

    // Return updated user
    const [rows] = await pool.query(
      `SELECT 
    id,
    fullName,
    email,
    role,
    membership,
    membershipId,
    companyName,
    serviceType,
    phone,
    whatsapp,
    telegram,
    city,
    location,
    referralCode,
    referralClicks,
    idFile AS idDocument,
    license AS profileImage,
    tradeRegistration AS certificate,
    servicePhotos,
    video,
    priceList,
    createdAt
  FROM users
  WHERE id = ?`,
      [userId]
    );


    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT 
        id,
        fullName,
        email,
        role,
        membership,
        membershipId,
        companyName,
        serviceType,
        phone,
        whatsapp,
        telegram,
        city,
        location,
        referralCode,
        referralClicks,
        createdAt
      FROM users
      WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ msg: "Failed to fetch user profile" });
  }
};

// Get referred users
exports.getReferredUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT 
        id,
        fullName,
        email,
        role,
        createdAt
      FROM users
      WHERE referredBy = ?
      ORDER BY createdAt DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching referred users:", error);
    res.status(500).json({ msg: "Failed to fetch referred users" });
  }
};

// Update membership
exports.updateMembership = async (req, res) => {
  try {
    const userId = req.params.id;
    const { membership } = req.body;

    if (!["none", "basic", "premium", "enterprise"].includes(membership)) {
      return res.status(400).json({ msg: "Invalid membership" });
    }

    // If upgrading to provider role
    const role = ["basic", "premium", "enterprise"].includes(membership)
      ? "provider"
      : "user";

    const [result] = await pool.query(
      "UPDATE users SET membership = ?, role = ? WHERE id = ?",
      [membership, role, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ msg: "User not found" });

    const [rows] = await pool.query(
      `SELECT 
        id,
        fullName,
        email,
        role,
        membership,
        membershipId,
        companyName,
        serviceType,
        phone,
        whatsapp,
        telegram,
        city,
        location,
        referralCode,
        referralClicks,
        idDocument,
        profileImage,
        certificate,
        created_at
      FROM users
      WHERE id = ?`,
      [userId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating membership:", err);
    res.status(500).json({ msg: "Failed to update membership" });
  }
};

