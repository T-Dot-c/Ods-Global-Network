const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");




const User = require("../models/User");

// Update membership
router.post("/update", verifyToken, async (req, res) => {
  const { membership } = req.body;

  if (!["basic", "premium", "enterprise"].includes(membership)) {
    return res.status(400).json({ msg: "Invalid membership type" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.membership = membership;
    if (user.role !== "provider") user.role = "provider"; // auto-upgrade
    await user.save();

    res.status(200).json({ msg: "Membership updated", user });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update membership" });
  }
});
router.put("/:id/membership", verifyToken, async (req, res) => {
  const { membership } = req.body;
  const { id } = req.params;

  if (!["basic", "premium", "enterprise"].includes(membership)) {
    return res.status(400).json({ msg: "Invalid membership type" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        membership,
        role: "provider",
      },
      { new: true, runValidators: true } // runValidators to check schema rules
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ msg: "Membership updated", user });
  } catch (err) {
    console.error("Failed to update membership:", err);
    res.status(500).json({ msg: "Failed to update membership" });
  }
});



module.exports = router;
