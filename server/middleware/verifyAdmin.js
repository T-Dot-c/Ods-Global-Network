const { pool } = require("../config/db");

const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    // Check if user is admin (role = 'admin' or 'super_admin')
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userRole = rows[0].role;
    const adminRoles = ["admin", "super_admin", "customer_support_admin"];

    if (!adminRoles.includes(userRole)) {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }

    next();
  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = verifyAdmin;
