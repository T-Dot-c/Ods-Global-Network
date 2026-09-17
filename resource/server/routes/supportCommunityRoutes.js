const express = require("express");
const router = express.Router();
const multer = require("multer");

// memory storage (you can also configure diskStorage)
const upload = multer({ storage: multer.memoryStorage() });

// import controller
const {
  submitSupport,
  getAllSupportSubmissions,
  getSupportByMembershipId
} = require("../controllers/supportCommunityController");

// ✅ Add multer to the route
router.post(
  "/",
  upload.fields([
    { name: "photos" },
    { name: "videos" },
    { name: "docs" }
  ]),
  submitSupport
);

router.get("/", getAllSupportSubmissions);
router.get("/:membershipId", getSupportByMembershipId);

module.exports = router;

