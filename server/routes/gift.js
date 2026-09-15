const express = require("express");
const router = express.Router();
const cloudUpload = require("../middleware/cloudUpload");

const verifyToken = require("../middleware/verifyToken");

const {
  createGift,
  getAllGifts,
  deleteGift,
  confirmGiftCode,
  getGiftsByService,
  getAllGiftCodes,
  getAllGiftsWithCodes,
  getGiftCodesForInvoice,
  sendGiftCardEmail
} = require("../controllers/giftController");

/**
 * GIFT ROUTES
 */

// ✅ Protected route for admins to create gifts
router.post("/", verifyToken, createGift);


// ✅ Get all gifts
router.get("/", getAllGifts);

// ✅ Get all gifts with assigned codes
router.get("/with-codes", verifyToken, getAllGiftsWithCodes);

// ✅ Get all gift codes (admin / dashboard view)
router.get("/codes", verifyToken, getAllGiftCodes);

// ✅ Get gifts by service (instead of provider)
router.get("/service/:serviceId", verifyToken, getGiftsByService);

// ✅ Confirm gift code (public action, unless you want to protect it)
router.post("/:giftId/confirm-gift", confirmGiftCode);

// ✅ Send gift card email
router.post("/send-email", sendGiftCardEmail);

// ✅ Test email configuration
router.get("/test-email", (req, res) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    return res.status(500).json({
      success: false,
      message: "Email credentials not configured",
      hasEmailUser: !!EMAIL_USER,
      hasEmailPass: !!EMAIL_PASS
    });
  }
  
  res.status(200).json({
    success: true,
    message: "Email service is configured",
    hasEmailUser: !!EMAIL_USER,
    hasEmailPass: !!EMAIL_PASS
  });
});

// ✅ Delete gift (probably should be protected)
router.delete("/:id", verifyToken, deleteGift);

// ✅ Get gift codes for invoice
router.get("/invoice/:purchaseId", getGiftCodesForInvoice);

module.exports = router;


