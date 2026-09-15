const express = require("express");
const router = express.Router();
const kidneyController = require("../controllers/kidneyPatientController");
const combinedUpload = require("../middleware/combinedUpload");// ✅ use combined middleware

// POST: create kidney patient
router.post("/", combinedUpload([
  { name: "idDocument", maxCount: 1 },
  { name: "medicalCertificate", maxCount: 1 },
  { name: "videos", maxCount: 5 },
]), kidneyController.createKidneyPatient);

// GET all patients
router.get("/", kidneyController.getAllKidneyPatients);

module.exports = router;



