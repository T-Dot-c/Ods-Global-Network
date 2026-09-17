const express = require("express");
const router = express.Router();
const combinedUpload = require("../middleware/combinedUpload");
const { submitWomenInitiative } = require("../controllers/womenInitiativeController");

// ---------------- Define fields for local upload ----------------
const cpUpload = combinedUpload([
  { name: "idOrPassport", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "certificates", maxCount: 5 },
]);

router.post("/", cpUpload, submitWomenInitiative);

module.exports = router;




