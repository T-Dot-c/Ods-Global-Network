const express = require("express");
const router = express.Router();
const diasporaController = require("../controllers/diasporaController");
const verifyToken = require("../middleware/verifyToken");

// Diaspora-specific routes
router.get("/stats", verifyToken, diasporaController.getDiasporaStats);
router.get("/activity", verifyToken, diasporaController.getDiasporaActivity);
router.get("/events", verifyToken, diasporaController.getDiasporaEvents);
router.get("/causes", verifyToken, diasporaController.getDiasporaCauses);

module.exports = router;









