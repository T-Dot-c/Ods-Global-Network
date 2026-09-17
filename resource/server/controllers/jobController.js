const Job = require("../models/Job");

// Admin posts a new job
exports.createJob = async (req, res) => {
  const { title, description, location, employmentModel, specialization } = req.body;

  if (!title || !employmentModel || !specialization) {
    return res.status(400).json({
      msg: "Title, employment model, and specialization are required",
    });
  }

  try {
    const insertId = await Job.createJob({
      title,
      description,
      location,
      employmentModel,
      specialization,
    });

    res.status(201).json({
      msg: "Job posted successfully",
      jobId: insertId,
    });
  } catch (err) {
    console.error("❌ Error posting job:", err);
    res.status(500).json({ msg: "Server error posting job", error: err.message });
  }
};

// Get all posted jobs
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.getJobs();
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ msg: "Failed to fetch jobs", error: err.message });
  }
};
