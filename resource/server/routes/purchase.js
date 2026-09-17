const express = require("express");
const router = express.Router();
const { 
  getProviderPurchases, 
  updateGiftStatus,
  updatePurchaseStatus,
  getAllPurchases
} = require("../controllers/purchaseController");
const verifyToken = require("../middleware/verifyToken");

// Get all purchases (Admin) - MUST come before parameterized routes
router.get("/all", verifyToken, getAllPurchases);

// Update gift status
router.post("/gift/update-status", verifyToken, updateGiftStatus);

// GET purchases for a provider with gifts included
router.get("/provider/:providerId/purchases", verifyToken, getProviderPurchases);

// Update purchase status (Provider)
router.put("/:purchaseId/status", verifyToken, updatePurchaseStatus);

module.exports = router;
