const { listForUser, markRead, markAllRead } = require("../services/userNotificationService");

const listUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Authentication required" });

    const unreadOnly = String(req.query.unreadOnly || "").toLowerCase() === "true";
    const limit = req.query.limit;
    const offset = req.query.offset;

    const notifications = await listForUser(userId, { unreadOnly, limit, offset });
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("listUserNotifications error:", err);
    return res.status(500).json({ msg: "Failed to fetch notifications", error: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Authentication required" });

    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({ msg: "Invalid notification id" });
    }

    const updated = await markRead(userId, notificationId);
    if (!updated) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    return res.status(200).json({ msg: "Marked as read" });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ msg: "Failed to update notification", error: err.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Authentication required" });

    await markAllRead(userId);
    return res.status(200).json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    return res.status(500).json({ msg: "Failed to update notifications", error: err.message });
  }
};

module.exports = {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
