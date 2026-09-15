const express = require("express");
const router = express.Router();

const {
  checkAvailability,
} = require("../controllers/hotelController");

// Check hotel room availability
router.post("/check-availability", checkAvailability);


module.exports = router;
