const express = require("express");
const router = express.Router();
const { pool } = require("../config/db"); // ✅ MySQL connection pool
const multer = require("multer");
const path = require("path");

// 🔐 Basic admin verification
const verifyAdmin = (req, res, next) => {
  const isAdmin = req.headers.authorization === "Bearer your-admin-secret";
  if (!isAdmin) return res.status(403).json({ message: "Forbidden: Not Admin" });
  next();
};

// 🔧 Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

/* ------------------------- GET Programs ------------------------- */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM programs");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching programs:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------- POST Program ------------------------- */
router.post("/", verifyAdmin, upload.single("image"), async (req, res) => {
  const { title, category, services } = req.body;

  if (!title || !category || !services || !req.file) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // ✅ Insert into MySQL
    const [result] = await pool.query(
      "INSERT INTO programs (title, category, image, services) VALUES (?, ?, ?, ?)",
      [
        title,
        category,
        `/uploads/${req.file.filename}`,
        JSON.stringify(Array.isArray(services) ? services : [services]),
      ]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      category,
      image: `/uploads/${req.file.filename}`,
      services: Array.isArray(services) ? services : [services],
    });
  } catch (error) {
    console.error("❌ Error saving program:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
