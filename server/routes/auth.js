// routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const verifyToken = require("../middleware/verifyToken");
const authController = require("../controllers/authController");
const { changePassword } = require("../controllers/authController");
const { getAllUsers } = require("../controllers/userController");

// -------------------- Multer --------------------


const combinedUpload = require("../middleware/combinedUpload");

// Registration route (debugging enabled)
router.post(
  "/register",
  combinedUpload([
    { name: "id", maxCount: 1 },
    { name: "idFile", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "tradeRegistration", maxCount: 1 },
    { name: "servicePhotos", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "priceList", maxCount: 1 },
  ]),

  (err, req, res, next) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({ error: err.message });
    }
    next();
  },

  authController.register
);
// uses combinedUpload

// Login
router.post("/login", authController.login);

// Google OAuth2
router.get("/google", (req, res, next) => {
  console.log("🚀 Starting Google OAuth");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Callback URL:", process.env.NODE_ENV === "production"
    ? "https://wanaw.et/api/auth/google/callback"
    : "http://localhost:5000/api/auth/google/callback");
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const user = req.user;
      
      console.log("🔍 Google OAuth callback - User received:", {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        fullName: user?.fullName
      });
      
      if (!user) {
        console.error("❌ No user received from Google OAuth");
        throw new Error("No user received from Google OAuth");
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      
      console.log("🔍 JWT token generated for user:", user.id);

      // Redirect based on environment
      const frontendUrl = process.env.NODE_ENV === "production"
        ? "https://wanaw.et"
        : "http://localhost:5173";

      // Determine redirect path based on role
      let redirectPath = "/individual-dashboard";
      if (user.role === "admin") {
        redirectPath = "/dashboard";
      } else if (user.role === "provider") {
        redirectPath = "/provider-dashboard";
      } else if (user.role === "corporate") {
        redirectPath = "/corporate-dashboard";
      } else if (user.role === "diaspora") {
        redirectPath = "/diaspora-dashboard";
      }

      const redirectUrl = `${frontendUrl}${redirectPath}?token=${token}&userId=${user.id}`;
      console.log("🔍 Redirecting to:", redirectUrl);
      
      // Redirect with token
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google callback error:", error);
      const frontendUrl = process.env.NODE_ENV === "production"
        ? "https://wanaw.et"
        : "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Forgot / Reset password
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Current logged-in user
router.get("/me", verifyToken, authController.getCurrentUserProfile);
router.put("/me", verifyToken, authController.updateCurrentUserProfile);
router.put("/change-password", verifyToken, changePassword);

// Admin routes
router.get("/all-users", getAllUsers);

// Other features
router.post("/send-promo", authController.sendPromo);
router.post("/resolve-issue", authController.resolveSupportIssue);

// Get user by ID
router.get("/users/:id", verifyToken, authController.getUserProfile);

// Health check endpoint for debugging
router.get("/health", async (req, res) => {
  try {
    const { pool } = require("../config/db");
    const [rows] = await pool.query("SELECT 1 as test");
    res.json({ 
      status: "healthy", 
      database: "connected",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: err.message,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;


