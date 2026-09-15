const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { cloudUpload, uploadToCloudinaryMiddleware } = require("../middleware/cloudUpload");
const uploadLocal = require("../middleware/uploadLocal");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

const {
  createService,
  getAllServices,
  getProviderServices,
  getPurchases,
  getServiceById,
  deleteService,
  updateServiceStatus,
  updateService,
  purchaseService,
  getSubcategories,
  getGiftCodesByPurchase,
  getServiceReviews,
  addServiceReview,
} = require("../controllers/serviceController");

const ensureIsActiveColumn = async () => {
  try {
    const [columns] = await pool.query(`SHOW COLUMNS FROM services LIKE 'isActive'`);
    if (!columns.length) {
      console.warn("⚠️ services.isActive column missing – adding it now");
      await pool.query(`ALTER TABLE services ADD COLUMN isActive TINYINT(1) DEFAULT 1`);
      await pool.query(`UPDATE services SET isActive = 1 WHERE isActive IS NULL`);
      console.log("✅ Added services.isActive column");
    }
  } catch (err) {
    console.error("❌ Failed to ensure services.isActive column:", err.message);
  }
};

// GET all services
router.get("/", getAllServices);

// Test route without auth to verify routing
router.get("/admin/test-route", (req, res) => {
  console.log("✅ Test route hit!");
  res.json({ message: "Routing works! Admin routes are accessible." });
});

// GET pending services (admin only) - MUST come before any /:id routes
// This route must be defined before /:id to avoid route conflicts
router.get("/admin/pending", verifyToken, verifyAdmin, async (req, res) => {
  console.log("✅ [ROUTE MATCHED] /admin/pending route hit!");
  try {
    console.log("📋 Admin fetching pending services...");
    console.log("📋 Admin user:", req.user);
    
    // First, ensure status column exists
    try {
      const [columns] = await pool.query(`SHOW COLUMNS FROM services LIKE 'status'`);
      if (!columns.length) {
        await pool.query(`ALTER TABLE services ADD COLUMN status VARCHAR(50) DEFAULT 'pending'`);
        console.log("✅ Added status column to services table");
      }
    } catch (alterErr) {
      // Column might already exist, continue
      console.log("ℹ️ Status column check:", alterErr.message);
    }
    
    // Query with COALESCE to handle NULL status values
    const [services] = await pool.query(
      `SELECT s.*, 
              u.fullName AS providerName, 
              u.email AS providerEmail, 
              COALESCE(u.isVerified, 0) AS providerVerified
       FROM services s
       LEFT JOIN users u ON s.providerId = u.id
       WHERE COALESCE(s.status, 'pending') = 'pending'
       ORDER BY s.id DESC`
    );
    
    console.log(`✅ Found ${services.length} pending services`);
    res.status(200).json(services);
  } catch (err) {
    console.error("❌ Error fetching pending services:", err);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error code:", err.code);
    if (err.sqlMessage) console.error("❌ SQL Message:", err.sqlMessage);
    res.status(500).json({ 
      msg: "Failed to fetch pending services", 
      error: err.message,
      sqlError: err.sqlMessage || undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET provider services
router.get("/provider/:providerId/services", verifyToken, getProviderServices);

// GET subcategories
router.get("/subcategories", getSubcategories);

// GET purchases
router.get("/purchase", getPurchases);

// GET gift codes by purchase ID
router.get("/purchase/:purchaseId/gift-codes", getGiftCodesByPurchase);

// Reviews
router.get("/:id/reviews", getServiceReviews);
router.post("/:id/reviews", verifyToken, addServiceReview);

// GET service by ID
router.get("/:id", getServiceById);

// POST create service with Cloudinary image/video upload
router.post(
  "/",
  verifyToken,
  cloudUpload.single("image"), // Upload to temp storage first
  uploadToCloudinaryMiddleware, // Upload to Cloudinary and clean up temp file
  async (req, res, next) => {
    try {
      // If an image/video was uploaded, use Cloudinary URL
      if (req.file && req.file.cloudinaryUrl) {
        req.body.imageUrl = req.file.cloudinaryUrl;
      }
      await createService(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// Optional token verification middleware (doesn't fail if no token)
const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("ℹ️ No token provided - proceeding as guest purchase");
    return next(); // Continue without authentication
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from MySQL
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows && rows.length > 0) {
      req.user = rows[0]; // attach user object to request
      console.log("✅ User authenticated for purchase:", req.user.fullName);
    }
  } catch (error) {
    console.log("ℹ️ Token verification failed - proceeding as guest:", error.message);
    // Continue without authentication - guest purchase allowed
  }
  
  next();
};

// POST purchase service (recipient photos to Cloudinary, documents to local)
router.post(
  "/:id/purchase",
  optionalVerifyToken, // Optional authentication - doesn't fail if no token
  // Step 1: Handle multer file uploads - allow errors to pass through
  (req, res, next) => {
    cloudUpload.any()(req, res, (err) => {
      if (err) {
        console.log("⚠️ File upload error (continuing without files):", err.message);
        req.files = req.files || []; // Ensure req.files exists
        // Continue anyway - purchase can proceed without files
      }
      next(); // Always continue
    });
  },
  // Step 2: Manually upload to Cloudinary (graceful error handling)
  async (req, res, next) => {
    // Only try Cloudinary if we have files
    if (req.files && req.files.length > 0) {
      const { uploadToCloudinary } = require("../config/cloudinary");
      const fs = require("fs");
      
      // Upload each file to Cloudinary, but don't fail if one fails
      for (const file of req.files) {
        try {
          const filePath = file.path;
          if (filePath && fs.existsSync(filePath)) {
            const folder = 'wanaw/services';
            const cloudinaryResult = await uploadToCloudinary(filePath, folder);
            
            // Store Cloudinary URL
            file.cloudinaryUrl = cloudinaryResult.url;
            file.publicId = cloudinaryResult.public_id;
            file.resourceType = cloudinaryResult.resource_type;
            file.path = cloudinaryResult.url; // For backward compatibility
            
            // Delete temporary local file
            try {
              fs.unlinkSync(filePath);
            } catch (unlinkErr) {
              console.log("⚠️ Could not delete temp file:", unlinkErr.message);
            }
          }
        } catch (cloudinaryErr) {
          console.log("⚠️ Cloudinary upload error for file (continuing):", cloudinaryErr.message);
          // File upload failed, but continue - purchase can proceed
          // Don't set cloudinaryUrl, so purchaseService can handle it
        }
      }
    }
    next(); // Continue to purchase regardless of Cloudinary results
  },
  // Step 3: Process purchase
  async (req, res) => {
    try {
      // Process files (if any)
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const match = file.fieldname.match(/recipients\[(\d+)\]\[photo\]/);
          if (match) {
            // Use Cloudinary URL if available, otherwise use path
            file.cloudinaryUrl = file.cloudinaryUrl || file.path;
          }
        });
      }
      // Call purchaseService - it will handle all errors gracefully
      await purchaseService(req, res);
    } catch (err) {
      console.error("❌ Purchase route error:", err);
      // Let purchaseService handle the error gracefully
      await purchaseService(req, res);
    }
  }
);

// DELETE service (admin only)
router.delete("/:id", verifyToken, verifyAdmin, deleteService);

// PUT update service status (admin only)
router.put("/:id/status", verifyToken, verifyAdmin, updateServiceStatus);

// PUT approve service (admin only - convenience endpoint)
router.put("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    req.body = { status: "approved" };
    await updateServiceStatus(req, res);
  } catch (err) {
    res.status(500).json({ msg: "Failed to approve service", error: err.message });
  }
});

// PUT reject service (admin only - convenience endpoint)
router.put("/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    req.body = { status: "denied" };
    await updateServiceStatus(req, res);
  } catch (err) {
    res.status(500).json({ msg: "Failed to reject service", error: err.message });
  }
});

// PUT update service (discount and image) - for providers
router.put(
  "/:id",
  verifyToken,
  cloudUpload.single("image"), // Upload to temp storage first
  uploadToCloudinaryMiddleware, // Upload to Cloudinary and clean up temp file
  async (req, res, next) => {
    try {
      // If an image/video was uploaded, use Cloudinary URL
      if (req.file && req.file.cloudinaryUrl) {
        req.body.imageUrl = req.file.cloudinaryUrl;
      }
      await updateService(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// Multer error handling middleware (only catch unhandled errors)
router.use((err, req, res, next) => {
  // Skip error handling for purchase route - it handles errors internally
  if (req.path.includes('/purchase')) {
    return next(); // Let purchaseService handle the error
  }
  
  if (err.name === "MulterError") {
    console.error("❌ Multer error:", err.message);
    return res.status(400).json({ msg: err.message });
  } else if (err) {
    console.error("❌ Unhandled error:", err.message);
    return res.status(500).json({ msg: err.message || "Internal server error" });
  }
  next();
});

module.exports = router;
