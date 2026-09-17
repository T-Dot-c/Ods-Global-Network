const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// Get admin dashboard statistics
router.get("/dashboard-stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log("📊 Fetching admin dashboard stats...");

    // Get active users count (all non-admin users)
    let activeUsers = 0;
    try {
      const [activeUsersResult] = await pool.query(
        `SELECT COUNT(*) as count
         FROM users
         WHERE role IN ('individual', 'provider', 'corporate', 'diaspora')`
      );
      activeUsers = activeUsersResult[0]?.count || 0;
      console.log("📊 Raw active users query result:", activeUsersResult);
    } catch (userErr) {
      console.error("❌ Error fetching active users:", userErr);
      // Try alternative query
      try {
        const [altResult] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role != 'admin' AND role != 'super_admin' AND role != 'marketing_admin' AND role != 'customer_support_admin'`);
        activeUsers = altResult[0]?.count || 0;
      } catch (altErr) {
        console.error("❌ Alternative query also failed:", altErr);
      }
    }

    // Get total services count (all services regardless of status)
    let totalServices = 0;
    try {
      const [totalServicesResult] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM services`
      );
      totalServices = totalServicesResult[0]?.count || 0;
      console.log("📊 Raw services query result:", totalServicesResult);
    } catch (serviceErr) {
      console.error("❌ Error fetching services:", serviceErr);
      // Try to see if services table exists
      try {
        const [tableCheck] = await pool.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'services'`
        );
        console.log("📊 Services table exists:", tableCheck[0]?.count > 0);
      } catch (checkErr) {
        console.error("❌ Error checking services table:", checkErr);
      }
    }

    // Get pending reviews count (reviews that need approval or are pending)
    // Check if reviews table exists first
    let pendingReviews = 0;
    try {
      const [reviewsTableCheck] = await pool.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'reviews'`
      );
      
      if (reviewsTableCheck[0]?.count > 0) {
        const [pendingReviewsResult] = await pool.query(
          `SELECT COUNT(*) as pendingReviews 
           FROM reviews 
           WHERE status = 'pending' OR status IS NULL`
        );
        pendingReviews = pendingReviewsResult[0]?.pendingReviews || 0;
      }
    } catch (reviewsErr) {
      console.log("ℹ️ Reviews table not found or error:", reviewsErr.message);
      pendingReviews = 0;
    }

    // Get total revenue (sum of all purchases - check if total_amount column exists)
    let totalRevenue = 0;
    try {
      // Check if purchases table exists and has total_amount column
      const [purchasesTableCheck] = await pool.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'purchases'`
      );
      
      if (purchasesTableCheck[0]?.count > 0) {
        // Check if total_amount column exists
        const [columnCheck] = await pool.query(
          `SELECT COUNT(*) as count FROM information_schema.columns 
           WHERE table_schema = DATABASE() AND table_name = 'purchases' AND column_name = 'total_amount'`
        );
        
        if (columnCheck[0]?.count > 0) {
          // Use total_amount column
          const [revenueResult] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as totalRevenue 
             FROM purchases`
          );
          totalRevenue = revenueResult[0]?.totalRevenue || 0;
        } else {
          // Try amount column
          const [revenueResult] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as totalRevenue 
             FROM purchases`
          );
          totalRevenue = revenueResult[0]?.totalRevenue || 0;
        }
      }
    } catch (revenueErr) {
      console.log("ℹ️ Purchases table error:", revenueErr.message);
      totalRevenue = 0;
    }

    const stats = {
      activeUsers: Number(activeUsers) || 0,
      totalServices: Number(totalServices) || 0,
      pendingReviews: Number(pendingReviews) || 0,
      totalRevenue: Number(totalRevenue) || 0,
    };

    // Debug logging
    console.log("📊 Active Users:", activeUsers);
    console.log("📊 Total Services:", totalServices);
    console.log("📊 Pending Reviews:", pendingReviews);
    console.log("📊 Total Revenue:", totalRevenue);
    console.log("✅ Final Admin dashboard stats:", stats);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error fetching admin dashboard stats:", err);
    res.status(500).json({ 
      msg: "Failed to fetch dashboard statistics", 
      error: err.message 
    });
  }
});

module.exports = router;

