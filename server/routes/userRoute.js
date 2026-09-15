// routes/userRoute.js
const express = require("express");
const { updateMembership, getUserProfile, getReferredUsers } = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

// Get user profile
router.get("/profile", verifyToken, getUserProfile);

// Get referred users
router.get("/referred", verifyToken, getReferredUsers);

// Update membership (admin only)
router.put("/:id/membership", verifyToken, isAdmin, updateMembership);

module.exports = router;
