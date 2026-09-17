const pool = require("../config/db");
const DiasporaMember = require("../models/DiasporaMember");

// Create diaspora premium community member (for /api/diaspora-members)
exports.createDiasporaMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      country,
      // optional extras – we may log or use later
      profession,
      message,
      plan,
      price,
      cadence,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const member = new DiasporaMember({
      name,
      email,
      phone: phone || null,
      // Use country as location fallback so we still store something meaningful
      location: country || null,
      country: country || null,
      plan: plan || null,
      price: price || null,
      cadence: cadence || null,
    });

    const id = await member.save();

    console.log("✅ Diaspora member created:", {
      id,
      name,
      email,
      country,
      profession,
      plan,
      price,
      cadence,
    });

    return res.status(201).json({
      id,
      name,
      email,
      country,
      profession: profession || null,
      message: message || null,
      plan: plan || null,
      price: price || null,
      cadence: cadence || null,
    });
  } catch (error) {
    console.error("❌ Error creating diaspora member:", error);
    return res
      .status(500)
      .json({ error: "Failed to create diaspora member. Please try again." });
  }
};

// Get all diaspora members (simple admin/debug endpoint)
exports.getAllDiasporaMembers = async (_req, res) => {
  try {
    const members = await DiasporaMember.getAll();
    return res.json(members);
  } catch (error) {
    console.error("❌ Error fetching diaspora members:", error);
    return res.status(500).json({ error: "Failed to fetch diaspora members" });
  }
};

// Get diaspora-specific statistics
exports.getDiasporaStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("📊 Fetching diaspora stats for user:", userId);

    // Get total gifts sent by diaspora user
    const [giftsResult] = await pool.query(
      `SELECT COUNT(*) as totalGifts, COALESCE(SUM(s.price), 0) as totalAmount
       FROM gifts g
       JOIN services s ON g.service_id = s.id
       WHERE g.sender_id = ? AND g.is_active = 1`,
      [userId]
    );

    // Get active connections (recipients)
    const [connectionsResult] = await pool.query(
      `SELECT COUNT(DISTINCT g.recipient_name) as activeConnections
       FROM gifts g
       WHERE g.sender_id = ? AND g.is_active = 1`,
      [userId]
    );

    // Get community events count (placeholder - can be expanded)
    const [eventsResult] = await pool.query(
      `SELECT COUNT(*) as communityEvents
       FROM diaspora_members dm
       WHERE dm.user_id = ?`,
      [userId]
    );

    const stats = {
      totalGiftsSent: giftsResult[0].totalGifts || 0,
      totalAmountSent: giftsResult[0].totalAmount || 0,
      activeConnections: connectionsResult[0].activeConnections || 0,
      communityEvents: eventsResult[0].communityEvents || 0
    };

    console.log("✅ Diaspora stats fetched:", stats);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error fetching diaspora stats:", error);
    res.status(500).json({ error: "Failed to fetch diaspora statistics" });
  }
};

// Get diaspora recent activity
exports.getDiasporaActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("📈 Fetching diaspora activity for user:", userId);

    const [activity] = await pool.query(
      `SELECT 
         g.id,
         g.sender_name,
         g.recipient_name,
         g.message,
         g.created_at,
         s.name as service_name,
         s.price,
         g.is_active,
         g.status
       FROM gifts g
       JOIN services s ON g.service_id = s.id
       WHERE g.sender_id = ?
       ORDER BY g.created_at DESC
       LIMIT 10`,
      [userId]
    );

    console.log("✅ Diaspora activity fetched:", activity.length, "items");
    res.json(activity);
  } catch (error) {
    console.error("❌ Error fetching diaspora activity:", error);
    res.status(500).json({ error: "Failed to fetch diaspora activity" });
  }
};

// Get diaspora community events
exports.getDiasporaEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("📅 Fetching diaspora events for user:", userId);

    // For now, return mock data - can be expanded with real events table
    const events = [
      {
        id: 1,
        title: "Ethiopian New Year Celebration",
        description: "Join us for the annual Ethiopian New Year celebration in your city",
        date: "2024-09-11",
        type: "Cultural",
        location: "Community Center"
      },
      {
        id: 2,
        title: "Diaspora Business Networking",
        description: "Connect with fellow Ethiopian entrepreneurs and business owners",
        date: "2024-09-15",
        type: "Business",
        location: "Online"
      },
      {
        id: 3,
        title: "Support Ethiopia Fundraiser",
        description: "Help raise funds for education and healthcare initiatives in Ethiopia",
        date: "2024-09-20",
        type: "Charity",
        location: "Various Locations"
      }
    ];

    console.log("✅ Diaspora events fetched:", events.length, "events");
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching diaspora events:", error);
    res.status(500).json({ error: "Failed to fetch diaspora events" });
  }
};

// Get diaspora support causes
exports.getDiasporaCauses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("❤️ Fetching diaspora causes for user:", userId);

    // For now, return mock data - can be expanded with real causes table
    const causes = [
      {
        id: 1,
        title: "Education for All",
        description: "Supporting primary education in rural Ethiopia",
        currentAmount: 15000,
        targetAmount: 50000,
        progress: 30,
        category: "Education"
      },
      {
        id: 2,
        title: "Healthcare Access",
        description: "Providing medical supplies and equipment to rural clinics",
        currentAmount: 25000,
        targetAmount: 75000,
        progress: 33,
        category: "Healthcare"
      },
      {
        id: 3,
        title: "Clean Water Initiative",
        description: "Building wells and water systems in underserved communities",
        currentAmount: 40000,
        targetAmount: 100000,
        progress: 40,
        category: "Infrastructure"
      }
    ];

    console.log("✅ Diaspora causes fetched:", causes.length, "causes");
    res.json(causes);
  } catch (error) {
    console.error("❌ Error fetching diaspora causes:", error);
    res.status(500).json({ error: "Failed to fetch diaspora causes" });
  }
};