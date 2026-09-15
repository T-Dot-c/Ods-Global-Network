const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const providerController = require("../controllers/providerController");

// Get all providers (admin only)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, fullName, email, role, membership, isVerified, verifiedAt, phone, companyName, createdAt
       FROM users 
       WHERE role = 'provider'
       ORDER BY createdAt DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching providers:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Dashboard endpoints — must be registered before /:id so "stats"/"orders" are not treated as IDs
router.get("/stats", verifyToken, providerController.getProviderStats);
router.get("/orders", verifyToken, providerController.getRecentOrders);

// Get provider by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership, isVerified, verifiedAt FROM users WHERE id = ? AND role = 'provider'",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "Provider not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching provider:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin verify provider (admin can verify, only provider role users can be verified)
router.put("/:id/verify", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // First check if the user exists and has provider role
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Ensure the user is a provider
    if (rows[0].role !== 'provider') {
      return res.status(400).json({ 
        msg: "Only users with provider role can be verified as providers" 
      });
    }

    // Update verification status
    await pool.query(
      "UPDATE users SET isVerified = 1, verifiedAt = NOW() WHERE id = ?",
      [req.params.id]
    );

    const [updated] = await pool.query(
      "SELECT id, fullName, email, role, membership, isVerified, verifiedAt FROM users WHERE id = ?",
      [req.params.id]
    );

    console.log(`✅ Provider ${req.params.id} verified by admin`);
    res.json({ 
      msg: "Provider verified successfully", 
      provider: updated[0]
    });
  } catch (err) {
    console.error("Error verifying provider:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin unverify provider (admin can unverify)
router.put("/:id/unverify", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // First check if the user exists and has provider role
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Ensure the user is a provider
    if (rows[0].role !== 'provider') {
      return res.status(400).json({ 
        msg: "Only users with provider role can be unverified" 
      });
    }

    await pool.query(
      "UPDATE users SET isVerified = 0, verifiedAt = NULL WHERE id = ?",
      [req.params.id]
    );

    const [updated] = await pool.query(
      "SELECT id, fullName, email, role, membership, isVerified, verifiedAt FROM users WHERE id = ?",
      [req.params.id]
    );

    console.log(`✅ Provider ${req.params.id} unverified by admin`);
    res.json({ 
      msg: "Provider verification removed", 
      provider: updated[0]
    });
  } catch (err) {
    console.error("Error unverifying provider:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin approve provider (same as verify, but explicit approval action)
router.put("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (rows[0].role !== 'provider') {
      return res.status(400).json({ 
        msg: "Only users with provider role can be approved" 
      });
    }

    await pool.query(
      "UPDATE users SET isVerified = 1, verifiedAt = NOW() WHERE id = ?",
      [req.params.id]
    );

    const [updated] = await pool.query(
      "SELECT id, fullName, email, role, membership, isVerified, verifiedAt FROM users WHERE id = ?",
      [req.params.id]
    );

    console.log(`✅ Provider ${req.params.id} approved by admin`);
    res.json({ 
      msg: "Provider approved successfully", 
      provider: updated[0]
    });
  } catch (err) {
    console.error("Error approving provider:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin delete provider (soft delete by updating role or hard delete)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    if (rows[0].role !== 'provider') {
      return res.status(400).json({ 
        msg: "Only users with provider role can be deleted" 
      });
    }

    // Delete provider (hard delete)
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    console.log(`✅ Provider ${req.params.id} deleted by admin`);
    res.json({ 
      msg: "Provider deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting provider:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin update provider status
router.put("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ 
        msg: "Invalid status. Must be 'active', 'inactive', or 'suspended'" 
      });
    }

    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    if (rows[0].role !== 'provider') {
      return res.status(400).json({ 
        msg: "Only users with provider role can have status updated" 
      });
    }

    // Check if status column exists, if not create it
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
      `);
    } catch (alterErr) {
      // Column might already exist
      console.log("Status column check:", alterErr.message);
    }

    await pool.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    const [updated] = await pool.query(
      "SELECT id, fullName, email, role, membership, isVerified, verifiedAt, status FROM users WHERE id = ?",
      [req.params.id]
    );

    console.log(`✅ Provider ${req.params.id} status updated to ${status} by admin`);
    res.json({ 
      msg: "Provider status updated successfully", 
      provider: updated[0]
    });
  } catch (err) {
    console.error("Error updating provider status:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;




