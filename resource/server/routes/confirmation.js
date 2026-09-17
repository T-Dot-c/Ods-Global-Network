const express = require("express");
const router = express.Router();
const Gift = require("../models/Gift");
const sendNotifications = require("../utils/sendNotifications");

router.post("/confirm-delivery", async (req, res) => {
  const { code, providerId } = req.body;

  try {
    const gift = await Gift.findOne({ deliveryCode: code, serviceProvider: providerId });

    if (!gift) {
      return res.status(404).json({ msg: "Invalid code or provider." });
    }

    if (gift.status === "delivered") {
      return res.status(400).json({ msg: "Already confirmed." });
    }

    gift.status = "delivered";
    gift.deliveredAt = new Date();
    await gift.save();

    const message = `Gift/Service has been delivered successfully on ${gift.deliveredAt.toLocaleString()}.`;

    await sendNotifications({
      recipient: gift.recipient, // assuming this is populated with name/email/phone/etc.
      providerId: gift.serviceProvider,
      message,
    });

    res.json({ msg: "Delivery confirmed successfully.", deliveredAt: gift.deliveredAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
});

