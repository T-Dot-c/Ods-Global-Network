const express = require("express");
const router = express.Router();

const {
  createPremiumMember,
  getPremiumMembers,
} = require("../controllers/premiumCommunityController");

router.post("/", createPremiumMember);
router.get("/", getPremiumMembers);

module.exports = router;




