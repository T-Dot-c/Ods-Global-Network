const { pool } = require("../config/db");

// Create a new job
async function createJob(data) {
  const query = `
    INSERT INTO jobs (title, description, location, employmentModel, specialization)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    data.title,
    data.description,
    data.location,
    data.employmentModel,
    data.specialization,
  ];
  const [result] = await pool.query(query, values);
  return result.insertId;
}

// Fetch all jobs
async function getJobs() {
  const query = `SELECT * FROM jobs ORDER BY createdAt DESC`;
  const [rows] = await pool.query(query);
  return rows;
}

module.exports = {
  createJob,
  getJobs,
};


