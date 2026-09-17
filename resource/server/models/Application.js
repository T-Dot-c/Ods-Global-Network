const { pool } = require("../config/db");

// Insert new application
async function createApplication(data) {
  const query = `
    INSERT INTO applications 
    (fullName, email, phone, currentLocation, specialization, employmentModel, cvPath, credentialsPath, coverLetter, credentialsLink, jobId) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.fullName,
    data.email,
    data.phone,
    data.currentLocation,
    data.specialization,
    data.employmentModel,
    data.cvPath,
    data.credentialsPath,
    data.coverLetter,
    data.credentialsLink,
    data.jobId,
  ];
  const [result] = await pool.query(query, values);
  return result.insertId;
}

// Fetch all applications with job info
async function getAllApplications() {
  const query = `
    SELECT a.*, j.title AS jobTitle, j.description AS jobDescription
    FROM applications a
    LEFT JOIN jobs j ON a.jobId = j.id
    ORDER BY a.createdAt DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
}

// Update application by ID
async function updateApplication(id, data) {
  const query = `
    UPDATE applications
    SET fullName=?, email=?, phone=?, currentLocation=?, specialization=?, employmentModel=?, cvPath=?, credentialsPath=?, coverLetter=?, credentialsLink=?
    WHERE id=?
  `;
  const values = [
    data.fullName,
    data.email,
    data.phone,
    data.currentLocation,
    data.specialization,
    data.employmentModel,
    data.cvPath,
    data.credentialsPath,
    data.coverLetter,
    data.credentialsLink,
    id,
  ];
  const [result] = await pool.query(query, values);
  return result;
}

// Delete application by ID
async function deleteApplication(id) {
  const query = `DELETE FROM applications WHERE id=?`;
  const [result] = await pool.query(query, [id]);
  return result;
}

module.exports = {
  createApplication,
  getAllApplications,
  updateApplication,
  deleteApplication,
};
