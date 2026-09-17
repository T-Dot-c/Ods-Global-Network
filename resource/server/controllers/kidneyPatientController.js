const path = require("path");
const fs = require("fs");
const KidneyPatient = require("../models/KidneyPatient");

// ---------------- Create kidney patient ----------------
exports.createKidneyPatient = async (req, res) => {
  try {
    const {
      name, age, phone, whatsapp, telegram,
      email, facilityName, location, message
    } = req.body;

    const idDocumentFile = req.files?.idDocument?.[0];
    const medicalCertificateFile = req.files?.medicalCertificate?.[0];
    const videosFiles = req.files?.videos || [];

    const newPatient = {
      name,
      age,
      phone,
      whatsapp,
      telegram,
      email,
      facility: facilityName,
      location,
      message,
      // Save local files relative to /uploads
      idDocument: idDocumentFile ? `/uploads/${idDocumentFile.filename}` : null,
      medicalCertificate: medicalCertificateFile ? `/uploads/${medicalCertificateFile.filename}` : null,
      // Local video files
      videos: videosFiles.length > 0 ? videosFiles.map(v => `/uploads/${v.filename}`) : [],
    };

    const createdPatient = await KidneyPatient.create(newPatient);

    res.status(201).json({
      message: "Kidney patient created successfully",
      patient: createdPatient,
    });
  } catch (err) {
    console.error("❌ KidneyPatient creation error:", err);
    res.status(500).json({ error: "Failed to create patient", detail: err.message });
  }
};

// ---------------- Get all kidney patients ----------------
exports.getAllKidneyPatients = async (req, res) => {
  try {
    const patients = await KidneyPatient.getAll();

    const formattedPatients = patients.map((p) => {
      // Parse videos array (local files)
      let videosArray = [];
      try {
        if (p.videos) {
          videosArray = typeof p.videos === "string" ? JSON.parse(p.videos) : p.videos;
        }
      } catch (err) {
        console.error("❌ Error parsing videos for patient id:", p.id, err);
      }

      // Build URLs for local files
      const formatFileUrl = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith("/uploads")) {
          // Local file
          return `${req.protocol}://${req.get("host")}${filePath}`;
        } else if (filePath.startsWith("http")) {
          // Already a full URL (legacy data)
          return filePath;
        }
        return null;
      };

      return {
        ...p,
        videos: Array.isArray(videosArray) ? videosArray : [],
        idDocument: formatFileUrl(p.idDocument),
        medicalCertificate: formatFileUrl(p.medicalCertificate),
      };
    });

    res.status(200).json(formattedPatients);
  } catch (err) {
    console.error("❌ Error fetching KidneyPatients:", err);
    res.status(500).json({ error: "Failed to fetch patients", detail: err.message });
  }
};


// GET patient by ID
exports.getKidneyPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await KidneyPatient.getById(id);

    if (!patient) return res.status(404).json({ error: "Patient not found" });

    res.status(200).json(patient);
  } catch (err) {
    console.error("❌ Error fetching KidneyPatient:", err);
    res.status(500).json({ error: "Failed to fetch patient", detail: err.message });
  }
};

// UPDATE patient
exports.updateKidneyPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patientExists = await KidneyPatient.getById(id);
    if (!patientExists) return res.status(404).json({ error: "Patient not found" });

    const { name, phone, whatsapp, telegram, email, facilityName, location, message, age } = req.body;

    let idDocumentUrl = patientExists.idDocument;
    let medicalCertificateUrl = patientExists.medicalCertificate;
    let videoUrls = patientExists.videos;

    if (req.files?.idDocument?.[0]) {
      idDocumentUrl = `/uploads/${req.files.idDocument[0].filename}`;
    }
    if (req.files?.medicalCertificate?.[0]) {
      medicalCertificateUrl = `/uploads/${req.files.medicalCertificate[0].filename}`;
    }
    if (req.files?.videos) {
      videoUrls = [];
      for (const file of req.files.videos) {
        videoUrls.push(`/uploads/${file.filename}`);
      }
    }

    const updatedPatient = await KidneyPatient.update(id, {
      name,
      phone,
      whatsapp,
      telegram,
      email,
      facilityName,
      location,
      message,
      age,
      idDocument: idDocumentUrl,
      medicalCertificate: medicalCertificateUrl,
      videos: videoUrls,
    });

    res.status(200).json({ message: "Patient updated", patient: updatedPatient });
  } catch (err) {
    console.error("❌ Error updating KidneyPatient:", err);
    res.status(500).json({ error: "Failed to update patient", detail: err.message });
  }
};

// DELETE patient
exports.deleteKidneyPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patientExists = await KidneyPatient.getById(id);
    if (!patientExists) return res.status(404).json({ error: "Patient not found" });

    await KidneyPatient.delete(id);
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting KidneyPatient:", err);
    res.status(500).json({ error: "Failed to delete patient", detail: err.message });
  }
};
