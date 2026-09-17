const { pool } = require("../config/db");
const GiftNotification = {
  // Create a new notification
  create: async (data) => {
    const {
      occasion_id,
      occasion_name, // 🔧 Added this
      service_id,
      sender_id,
      sender_name,
      recipient_name,
      recipient_email,
      recipient_phone,
      recipient_whatsapp,
      recipient_telegram,
      recipient_photo,
      message,
      provider_message,
      notify_provider,
      sent_via,
      status,
      gift_code,
      delivery_status,
      delivered_at,
      provider_id,
      provider_name,
      service_location,
      purchase_id,
      gift_id,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO gift_notifications
      (occasion_id, occasion_name, service_id, sender_id, sender_name,   -- 🔧 Added occasion_name here
      recipient_name, recipient_email, recipient_phone, recipient_whatsapp, recipient_telegram, recipient_photo,
      message, provider_message, notify_provider, sent_via,
      status, gift_code, delivery_status, delivered_at,
      provider_id, provider_name, service_location,
      purchase_id, gift_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,   -- 🔧 Added one ? for occasion_name
      [
        occasion_id || null,
        occasion_name || null,   // 🔧 Added this value
        service_id || null,
        sender_id || null,
        sender_name || null,
        recipient_name || null,
        recipient_email || null,
        recipient_phone || null,
        recipient_whatsapp || null,
        recipient_telegram || null,
        recipient_photo || null,
        message || null,
        provider_message || null,
        notify_provider || false,
        sent_via ? JSON.stringify(sent_via) : null,
        status || "pending",
        gift_code || null,
        delivery_status || "pending",
        delivered_at || null,
        provider_id || null,
        provider_name || null,
        service_location || null,
        purchase_id || null,
        gift_id || null
      ]
    );
    return result.insertId;
  },


  // Find one by gift_id and gift_code
  findOne: async ({ gift_id, gift_code }) => {
    const [rows] = await pool.query(
      `SELECT * FROM gift_notifications WHERE gift_id = ? AND gift_code = ? LIMIT 1`,
      [gift_id, gift_code]
    );
    return rows[0] || null;
  },

  // Update delivery status
  updateDelivery: async (id, status) => {
    await pool.query(
      `UPDATE gift_notifications SET delivery_status = ?, delivered_at = NOW() WHERE id = ?`,
      [status, id]
    );
  },

  // Fetch all notifications with optional filters
  findAll: async ({ status, dateFrom, dateTo } = {}) => {
    let query = `SELECT gn.*, g.title AS gift_title, g.category AS gift_category 
                 FROM gift_notifications gn
                 LEFT JOIN gifts g ON gn.gift_id = g.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND gn.delivery_status = ?`;
      params.push(status);
    }
    if (dateFrom) {
      query += ` AND gn.created_at >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND gn.created_at <= ?`;
      params.push(dateTo);
    }

    query += ` ORDER BY gn.created_at DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },
};

module.exports = GiftNotification;


