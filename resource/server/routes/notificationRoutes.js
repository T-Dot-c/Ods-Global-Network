const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { sendGiftNotifications, sendProviderAvailabilityEmail } = require("../controllers/notificationController");
const {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/userNotificationController");

router.get("/", verifyToken, listUserNotifications);
router.patch("/read-all", verifyToken, markAllNotificationsRead);
router.patch("/:id/read", verifyToken, markNotificationRead);

router.post("/send", sendGiftNotifications);

// Provider replies to room availability inquiries via email
router.post("/provider-email", sendProviderAvailabilityEmail);

module.exports = router;



