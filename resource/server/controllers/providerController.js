const { pool } = require("../config/db");

const PROVIDER_ROLES = new Set(["provider", "corporate"]);

const assertProviderUser = (req, res) => {
  const user = req.user;
  if (!user?.id) {
    res.status(401).json({ success: false, msg: "Authentication required" });
    return null;
  }
  if (!PROVIDER_ROLES.has(String(user.role || "").toLowerCase())) {
    res.status(403).json({
      success: false,
      msg: "Only provider accounts can access provider dashboard data.",
    });
    return null;
  }
  return user;
};

// Get provider dashboard statistics (from services + purchases)
exports.getProviderStats = async (req, res) => {
  try {
    const user = assertProviderUser(req, res);
    if (!user) return;

    const userId = user.id;

    const [servicesResult] = await pool.query(
      "SELECT COUNT(*) as totalServices FROM services WHERE providerId = ?",
      [userId]
    );

    const [pendingOrdersResult] = await pool.query(
      `SELECT COUNT(*) as pendingOrders
       FROM purchases
       WHERE providerId = ?
         AND (status IS NULL OR LOWER(status) = 'pending')`,
      [userId]
    );

    const [revenueResult] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as totalRevenue
       FROM purchases
       WHERE providerId = ?
         AND (status IS NULL OR LOWER(status) <> 'cancelled')`,
      [userId]
    );

    const [customersResult] = await pool.query(
      `SELECT COUNT(DISTINCT buyerEmail) as activeCustomers
       FROM purchases
       WHERE providerId = ?
         AND buyerEmail IS NOT NULL
         AND buyerEmail <> ''`,
      [userId]
    );

    const stats = {
      totalServices: Number(servicesResult[0]?.totalServices) || 0,
      pendingOrders: Number(pendingOrdersResult[0]?.pendingOrders) || 0,
      totalRevenue: Number(revenueResult[0]?.totalRevenue) || 0,
      activeCustomers: Number(customersResult[0]?.activeCustomers) || 0,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error getting provider stats:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to get provider statistics",
      error: error.message,
    });
  }
};

// Get recent orders for provider (purchases are the source of truth)
exports.getRecentOrders = async (req, res) => {
  try {
    const user = assertProviderUser(req, res);
    if (!user) return;

    const userId = user.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const [orders] = await pool.query(
      `SELECT
         p.id,
         COALESCE(gn.recipient_name, p.buyerName, 'Customer') AS recipientName,
         COALESCE(gn.recipient_phone, '') AS recipientPhone,
         COALESCE(gn.occasion_name, s.title, p.itemType, '') AS message,
         COALESCE(p.total_amount, 0) AS amount,
         COALESCE(LOWER(p.status), 'pending') AS status,
         p.created_at AS createdAt,
         COALESCE(s.title, 'Service') AS serviceName,
         COALESCE(p.buyerName, 'Unknown') AS senderName
       FROM purchases p
       LEFT JOIN services s ON p.itemId = s.id
       LEFT JOIN (
         SELECT gn1.purchase_id, gn1.recipient_name, gn1.recipient_phone, gn1.occasion_name
         FROM gift_notifications gn1
         INNER JOIN (
           SELECT purchase_id, MIN(id) AS min_id
           FROM gift_notifications
           GROUP BY purchase_id
         ) gn2 ON gn1.id = gn2.min_id
       ) gn ON gn.purchase_id = p.id
       WHERE p.providerId = ?
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error getting recent orders:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to get recent orders",
      error: error.message,
    });
  }
};
