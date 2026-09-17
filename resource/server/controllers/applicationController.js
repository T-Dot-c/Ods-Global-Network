const Application = require("../models/Application");

// ---------------- Create new application ----------------
exports.createApplication = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone = null,
      currentLocation = null,
      specialization = null,
      employmentModel = null,
      coverLetter = null,
      credentialsLink = null,
    } = req.body;

    // Convert jobId to integer, fallback to null if invalid
    let jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) jobId = null;

    if (!fullName || !email) {
      return res.status(400).json({ msg: "Full name and email are required." });
    }

    // ---------------- Handle uploaded files ----------------
    // Files are stored locally in uploads directory
    const cvPath = req.files?.cv?.[0]?.filename ? `/uploads/${req.files.cv[0].filename}` : null;
    const credentialsPath = req.files?.credentials?.[0]?.filename ? `/uploads/${req.files.credentials[0].filename}` : null;

    const insertId = await Application.createApplication({
      fullName,
      email,
      phone,
      currentLocation,
      specialization,
      employmentModel,
      cvPath,
      credentialsPath,
      coverLetter,
      credentialsLink,
      jobId,
    });

    res.status(201).json({
      msg: "Application submitted successfully",
      applicationId: insertId,
    });
  } catch (err) {
    console.error("❌ Error submitting application:", err);
    res.status(500).json({ msg: "Server error submitting application", error: err.message });
  }
};

// ---------------- Get all applications ----------------
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.getAllApplications();
    res.status(200).json(applications);
  } catch (error) {
    console.error("❌ Fetch applications error:", error);
    res.status(500).json({ msg: "Server error fetching applications", error: error.message });
  }
};
// ---------------- Update application ----------------
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle file updates
    if (req.files?.cv) updates.cvPath = `/uploads/${req.files.cv[0].filename}`;
    if (req.files?.credentials) updates.credentialsPath = `/uploads/${req.files.credentials[0].filename}`;

    const updated = await Application.updateApplication(id, updates);

    if (!updated) {
      return res.status(404).json({ msg: "Application not found" });
    }

    res.status(200).json({ msg: "Application updated successfully", updated });
  } catch (err) {
    console.error("❌ Error updating application:", err);
    res.status(500).json({ msg: "Server error updating application", error: err.message });
  }
};

// ---------------- Delete application ----------------
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Application.deleteApplication(id);

    if (!deleted) {
      return res.status(404).json({ msg: "Application not found" });
    }

    res.status(200).json({ msg: "Application deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting application:", err);
    res.status(500).json({ msg: "Server error deleting application", error: err.message });
  }
};