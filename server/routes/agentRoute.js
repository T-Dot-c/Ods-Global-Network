const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const agentController = require("../controllers/agentController");

router.get("/professionals", verifyToken, agentController.listProfessionals);
router.get("/linked-professionals", verifyToken, agentController.listLinkedProfessionals);
router.post("/link-provider", verifyToken, agentController.linkProvider);
router.delete("/link-provider/:providerId", verifyToken, agentController.unlinkProvider);

module.exports = router;
