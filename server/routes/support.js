// 📁 routes/support.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db"); // ✅ use your MySQL pool

// Ensure availability table exists
async function ensureAvailabilityTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS support_availability_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    providerId INT NOT NULL,
    serviceId INT NOT NULL,
    senderName VARCHAR(255),
    senderEmail VARCHAR(255),
    checkInDate DATE,
    checkOutDate DATE,
    guests INT DEFAULT 1,
    roomPref VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

// POST route to save support request
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    await pool.query(
      "INSERT INTO support_tickets (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name, email, subject, message]
    );
    res.status(201).json({ message: "Support request submitted successfully" });
  } catch (error) {
    console.error("Error saving support request:", error);
    res.status(500).json({ error: "Server error. Could not save request." });
  }
});

// GET all support requests
router.get("/", async (req, res) => {
  try {
    const [requests] = await pool.query(
      "SELECT * FROM support_tickets ORDER BY createdAt DESC"
    );
    res.json(requests);
  } catch (error) {
    console.error("Error fetching support requests:", error);
    res.status(500).json({ error: "Failed to fetch support requests" });
  }
});

module.exports = router;

// ---- Hotel availability support endpoints ----
// Save availability request (guest-facing)
router.post("/availability-request", async (req, res) => {
  const { serviceId, senderName, senderEmail, checkInDate, checkOutDate, guests, roomPref } = req.body;
  if (!serviceId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ msg: "Missing required fields" });
  }
  try {
    await ensureAvailabilityTable();
    const [rows] = await pool.query("SELECT providerId FROM services WHERE id = ?", [serviceId]);
    if (!rows.length) return res.status(404).json({ msg: "Service not found" });
    const providerId = rows[0].providerId;

    await pool.query(
      `INSERT INTO support_availability_requests
        (providerId, serviceId, senderName, senderEmail, checkInDate, checkOutDate, guests, roomPref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [providerId, serviceId, senderName || null, senderEmail || null, checkInDate, checkOutDate, guests || 1, roomPref || null]
    );

    res.status(201).json({ msg: "Availability request saved" });
  } catch (error) {
    console.error("Error saving availability request:", error);
    res.status(500).json({ error: "Server error. Could not save request." });
  }
});

// Provider fetch availability requests
router.get("/availability/provider/:providerId", async (req, res) => {
  const { providerId } = req.params;
  try {
    await ensureAvailabilityTable();
    const [rows] = await pool.query(
      `SELECT r.*, s.title AS serviceTitle, s.price AS servicePrice
       FROM support_availability_requests r
       JOIN services s ON s.id = r.serviceId
       WHERE r.providerId = ?
       ORDER BY r.createdAt DESC`,
      [providerId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching availability requests:", error);
    res.status(500).json({ error: "Server error. Could not fetch requests." });
  }
});

