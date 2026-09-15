// server/controllers/reviewController.js
const { pool } = require("../config/db");
const { checkAndCreateReviewsTable } = require("../utils/checkReviewsTable");

/* ─────────────────────────────
   Create Review
───────────────────────────── */
exports.createReview = async (req, res) => {
  try {
    console.log("🎯 createReview controller called!");
    console.log("📝 Creating review - Request body:", req.body);
    console.log("👤 User:", req.user ? "Logged in" : "Guest");
    console.log("📝 Request method:", req.method);
    console.log("📝 Request path:", req.path);
    
    const { serviceId, rating, comment } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!serviceId) {
      console.error("❌ Missing serviceId");
      return res.status(400).json({ msg: "Service ID is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      console.error("❌ Invalid rating:", rating);
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Check if user already reviewed this service (check by userId OR email for guests)
    let existingReview;
    if (userId) {
      // Logged-in user: check by userId
      [existingReview] = await pool.query(
        `SELECT id FROM reviews WHERE serviceId = ? AND userId = ?`,
        [serviceId, userId]
      );
    } else {
      // Guest user: check by email if provided
      const checkEmail = req.user?.email || req.body.userEmail;
      if (checkEmail) {
        [existingReview] = await pool.query(
          `SELECT id FROM reviews WHERE serviceId = ? AND userEmail = ? AND userId IS NULL`,
          [serviceId, checkEmail]
        );
      }
    }

    if (existingReview && existingReview.length > 0) {
      return res.status(400).json({ msg: "You have already reviewed this service. You can update your existing review." });
    }

    // Prepare user info
    const userName = req.user?.fullName || 'Anonymous';
    const userEmail = req.user?.email || req.body.userEmail || null;

    console.log("💾 Inserting review:", { serviceId, userId, userName, userEmail, rating });

    // Insert review
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO reviews (serviceId, userId, userName, userEmail, rating, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
        [
          serviceId,
          userId || null,
          userName,
          userEmail,
          rating,
          comment || null
        ]
      );
      console.log("✅ Review inserted with ID:", result.insertId);
    } catch (dbError) {
      console.error("❌ Database error inserting review:", dbError);
      console.error("❌ Error code:", dbError.code);
      console.error("❌ Error message:", dbError.message);
      console.error("❌ SQL state:", dbError.sqlState);
      
      // Check if table doesn't exist - try to create it automatically
      if (dbError.code === 'ER_NO_SUCH_TABLE' || dbError.message.includes("doesn't exist") || dbError.message.includes("Table")) {
        console.error("❌ Reviews table does not exist! Attempting to create it...");
        try {
          const created = await checkAndCreateReviewsTable();
          if (created) {
            console.log("✅ Table created, retrying insert...");
            // Retry the insert
            [result] = await pool.query(
              `INSERT INTO reviews (serviceId, userId, userName, userEmail, rating, comment, status)
               VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
              [
                serviceId,
                userId || null,
                userName,
                userEmail,
                rating,
                comment || null
              ]
            );
            console.log("✅ Review inserted successfully after table creation!");
          } else {
            return res.status(500).json({ 
              msg: "Failed to create reviews table. Please contact support.",
              error: dbError.message,
              code: dbError.code
            });
          }
        } catch (createErr) {
          console.error("❌ Failed to create table:", createErr);
          return res.status(500).json({ 
            msg: "Database setup issue. Please contact support.",
            error: createErr.message,
            code: createErr.code
          });
        }
      } else {
        // Check for foreign key constraint errors
        if (dbError.code === 'ER_NO_REFERENCED_ROW_2' || dbError.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(400).json({ 
            msg: "Invalid service ID. The service does not exist.",
            error: dbError.message 
          });
        }
        
        // Check for duplicate entry (if unique constraint exists)
        if (dbError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ 
            msg: "You have already submitted a review for this service.",
            error: dbError.message 
          });
        }
        
        // Other database errors
        return res.status(500).json({ 
          msg: "Database error. Please try again or contact support.",
          error: dbError.message,
          code: dbError.code
        });
      }
    }

    // Update service average rating
    try {
      await updateServiceRating(serviceId);
    } catch (ratingError) {
      console.error("⚠️ Error updating service rating (non-critical):", ratingError);
      // Don't fail the request if rating update fails
    }

    res.status(201).json({
      msg: "Review submitted successfully",
      reviewId: result.insertId
    });
  } catch (err) {
    console.error("❌ Error creating review:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ 
      msg: "Failed to create review", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/* ─────────────────────────────
   Get Reviews for a Service
───────────────────────────── */
exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.*, 
              u.fullName AS reviewerName,
              u.email AS reviewerEmail
       FROM reviews r
       LEFT JOIN users u ON r.userId = u.id
       WHERE r.serviceId = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [serviceId]
    );

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      serviceId: review.serviceId,
      userId: review.userId,
      userName: review.userName || review.reviewerName || 'Anonymous',
      userEmail: review.userEmail || review.reviewerEmail || '',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at
    }));

    res.json(formattedReviews);
  } catch (err) {
    console.error("❌ Error fetching reviews:", err);
    res.status(500).json({ msg: "Failed to fetch reviews", error: err.message });
  }
};

/* ─────────────────────────────
   Update Review (by owner)
───────────────────────────── */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Check if review exists and belongs to user
    const [review] = await pool.query(
      `SELECT * FROM reviews WHERE id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Check ownership (allow if userId matches or if no userId was set and email matches)
    const isOwner = review[0].userId === userId || 
                   (!review[0].userId && review[0].userEmail === req.user?.email);

    if (!isOwner && req.user?.role !== 'super_admin') {
      return res.status(403).json({ msg: "You can only update your own reviews" });
    }

    // Update review
    await pool.query(
      `UPDATE reviews 
       SET rating = ?, comment = ?, updated_at = NOW()
       WHERE id = ?`,
      [rating, comment || null, reviewId]
    );

    // Update service average rating
    await updateServiceRating(review[0].serviceId);

    res.json({ msg: "Review updated successfully" });
  } catch (err) {
    console.error("❌ Error updating review:", err);
    res.status(500).json({ msg: "Failed to update review", error: err.message });
  }
};

/* ─────────────────────────────
   Delete Review (by owner or admin)
───────────────────────────── */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'super_admin' || req.user?.role === 'customer_support_admin';

    // Check if review exists
    const [review] = await pool.query(
      `SELECT * FROM reviews WHERE id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Check ownership
    const isOwner = review[0].userId === userId || 
                   (!review[0].userId && review[0].userEmail === req.user?.email);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "You can only delete your own reviews" });
    }

    const serviceId = review[0].serviceId;

    // Delete review
    await pool.query(`DELETE FROM reviews WHERE id = ?`, [reviewId]);

    // Update service average rating
    await updateServiceRating(serviceId);

    res.json({ msg: "Review deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting review:", err);
    res.status(500).json({ msg: "Failed to delete review", error: err.message });
  }
};

/* ─────────────────────────────
   Get All Reviews (Admin)
───────────────────────────── */
exports.getAllReviews = async (req, res) => {
  try {
    const { serviceId, status, userId } = req.query;

    let query = `
      SELECT r.*, 
             s.title AS serviceTitle,
             u.fullName AS reviewerName,
             u.email AS reviewerEmail
      FROM reviews r
      LEFT JOIN services s ON r.serviceId = s.id
      LEFT JOIN users u ON r.userId = u.id
      WHERE 1=1
    `;
    const params = [];

    if (serviceId) {
      query += " AND r.serviceId = ?";
      params.push(serviceId);
    }

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    if (userId) {
      query += " AND r.userId = ?";
      params.push(userId);
    }

    query += " ORDER BY r.created_at DESC";

    const [reviews] = await pool.query(query, params);

    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching all reviews:", err);
    res.status(500).json({ msg: "Failed to fetch reviews", error: err.message });
  }
};

/* ─────────────────────────────
   Update Review Status (Admin)
───────────────────────────── */
exports.updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: "Invalid status. Must be 'pending', 'approved', or 'rejected'" });
    }

    // Get serviceId before updating
    const [review] = await pool.query(
      `SELECT serviceId FROM reviews WHERE id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Update status
    await pool.query(
      `UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, reviewId]
    );

    // Update service average rating
    await updateServiceRating(review[0].serviceId);

    res.json({ msg: "Review status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating review status:", err);
    res.status(500).json({ msg: "Failed to update review status", error: err.message });
  }
};

/* ─────────────────────────────
   Helper: Update Service Average Rating
───────────────────────────── */
async function updateServiceRating(serviceId) {
  try {
    // Calculate average rating from approved reviews
    const [result] = await pool.query(
      `SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
       FROM reviews
       WHERE serviceId = ? AND status = 'approved'`,
      [serviceId]
    );

    const avgRating = result[0]?.avgRating ? parseFloat(result[0].avgRating).toFixed(2) : 0;
    const reviewCount = result[0]?.reviewCount || 0;

    console.log(`📊 Updating rating for service ${serviceId}: ${avgRating} (${reviewCount} reviews)`);

    // Update service table (if rating column exists)
    try {
      await pool.query(
        `UPDATE services SET rating = ?, reviewCount = ? WHERE id = ?`,
        [avgRating, reviewCount, serviceId]
      );
      console.log(`✅ Service rating updated successfully`);
    } catch (updateErr) {
      // If columns don't exist, try to add them
      if (updateErr.code === 'ER_BAD_FIELD_ERROR' || updateErr.message.includes("Unknown column")) {
        console.log("⚠️ Rating columns don't exist, attempting to add them...");
        try {
          // Check if rating column exists
          const [columns] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_NAME = 'services' AND COLUMN_NAME = 'rating'`
          );
          
          if (columns.length === 0) {
            await pool.query(`ALTER TABLE services ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00`);
            console.log("✅ Added rating column to services table");
          }
          
          // Check if reviewCount column exists
          const [reviewCountColumns] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_NAME = 'services' AND COLUMN_NAME = 'reviewCount'`
          );
          
          if (reviewCountColumns.length === 0) {
            await pool.query(`ALTER TABLE services ADD COLUMN reviewCount INT DEFAULT 0`);
            console.log("✅ Added reviewCount column to services table");
          }
          
          // Now try to update again
          await pool.query(
            `UPDATE services SET rating = ?, reviewCount = ? WHERE id = ?`,
            [avgRating, reviewCount, serviceId]
          );
          console.log("✅ Service rating updated after adding columns");
        } catch (alterErr) {
          console.error("⚠️ Could not add rating columns:", alterErr.message);
        }
      } else {
        console.log("⚠️ Could not update service rating:", updateErr.message);
      }
    }

    return { avgRating, reviewCount };
  } catch (err) {
    console.error("❌ Error updating service rating:", err);
    return { avgRating: 0, reviewCount: 0 };
  }
}

