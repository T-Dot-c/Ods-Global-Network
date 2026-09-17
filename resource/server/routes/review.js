// server/routes/review.js
const express = require("express");
const router = express.Router();

// Try to load controllers and middleware with error handling
let createReview, getServiceReviews, updateReview, deleteReview, getAllReviews, updateReviewStatus;
let verifyToken;

try {
  ({
    createReview,
    getServiceReviews,
    updateReview,
    deleteReview,
    getAllReviews,
    updateReviewStatus
  } = require("../controllers/reviewController"));
  
  verifyToken = require("../middleware/verifyToken");
  
  console.log("✅ Review routes loaded successfully");
} catch (err) {
  console.error("❌ Error loading review routes:", err);
  throw err;
}

// Optional token verification (for guest reviews)
const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without authentication for guest reviews
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    try {
      const { pool } = require("../config/db");
      const [rows] = await pool.query(
        "SELECT id, fullName, email, role FROM users WHERE id = ?",
        [decoded.id]
      );

      if (rows && rows.length > 0) {
        req.user = rows[0];
      }
    } catch (dbErr) {
      // Database error, continue as guest
      console.log("⚠️ Database error verifying token - proceeding as guest:", dbErr.message);
    }
  } catch (err) {
    // Invalid token, continue as guest
    console.log("⚠️ Invalid token for review - proceeding as guest");
  }
  
  next();
};

// Test route to verify the router is working
router.get("/test", (req, res) => {
  console.log("✅ Test route hit for reviews API");
  res.json({ msg: "Reviews API is working!", timestamp: new Date().toISOString() });
});

// Test POST route
router.post("/test", (req, res) => {
  console.log("✅ POST test route hit:", req.body);
  res.json({ msg: "Reviews POST endpoint is working!", received: req.body });
});

// Create review (optional auth - allows guest reviews)
router.post("/", optionalVerifyToken, createReview);

// Get reviews for a service (public)
router.get("/service/:serviceId", getServiceReviews);

// Update review (requires auth)
router.put("/:reviewId", verifyToken, updateReview);

// Delete review (requires auth)
router.delete("/:reviewId", verifyToken, deleteReview);

// Admin routes
router.get("/all", verifyToken, getAllReviews);
router.put("/:reviewId/status", verifyToken, updateReviewStatus);

module.exports = router;

