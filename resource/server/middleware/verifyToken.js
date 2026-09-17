const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token provided");
    return res.status(401).json({ msg: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token received:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Fetch user from MySQL
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership FROM users WHERE id = ?",
      [decoded.id]
    );

    console.log("DB rows fetched:", rows);

    if (!rows || rows.length === 0) {
      console.log(`User with ID ${decoded.id} not found in DB`);
      return res.status(404).json({ msg: "User not found" });
    }

    req.user = rows[0]; // attach user object to request
    console.log("User attached to req.user:", req.user);

    next();
  } catch (error) {
    console.error("Error in verifyToken:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        msg: "Token expired. Please log in again.",
        expiredAt: error.expiredAt,
      });
    }

    return res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = verifyToken;
