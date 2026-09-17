const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");
const {
  createRequest,
  getMyRequests,
  getOpenRequests,
  listRequestsRoleBased,
  acceptServiceRequest,
  submitProposal,
  getRequestDetails,
  updateProposalStatus,
  updateRequestStatus,
} = require("../controllers/serviceRequestController");

const router = express.Router();

const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role, membership FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows && rows.length > 0) req.user = rows[0];
  } catch (err) {
    // For guest submissions we ignore token errors and continue.
  }
  next();
};

// Customer endpoints
router.post("/requests", optionalVerifyToken, createRequest);
router.get("/my-requests", verifyToken, getMyRequests);

// Provider / admin — list before /requests/:id
router.get("/requests", verifyToken, listRequestsRoleBased);
router.get("/requests/open", verifyToken, getOpenRequests);
router.patch("/requests/:id/accept", verifyToken, acceptServiceRequest);
router.post("/requests/:id/proposals", verifyToken, submitProposal);

// General endpoints
router.get("/requests/:id", verifyToken, getRequestDetails);
router.patch("/proposals/:id", verifyToken, updateProposalStatus);
router.patch("/requests/:id/status", verifyToken, updateRequestStatus);

module.exports = router;
