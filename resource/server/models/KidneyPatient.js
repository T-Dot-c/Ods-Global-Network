const { pool } = require("../config/db");

class KidneyPatient {
  constructor(patient) {
    this.name = patient.name;
    this.age = patient.age;
    this.phone = patient.phone;
    this.whatsapp = patient.whatsapp;
    this.telegram = patient.telegram;
    this.email = patient.email;
    this.facilityName = patient.facilityName;
    this.location = patient.location;
    this.message = patient.message;
    this.idDocument = patient.idDocument;
    this.medicalCertificate = patient.medicalCertificate;
    this.videos = patient.videos || [];
  }

  // Create new patient
  static async create(patient) {
    const [result] = await pool.query(
      `INSERT INTO kidney_patients 
        (name, age, phone, whatsapp, telegram, email, facilityName, location, message, idDocument, medicalCertificate, videos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.name,
        patient.age,
        patient.phone,
        patient.whatsapp,
        patient.telegram,
        patient.email,
        patient.facilityName,
        patient.location,
        patient.message,
        patient.idDocument,
        patient.medicalCertificate,
        JSON.stringify(patient.videos || []),
      ]
    );
    return { _id: result.insertId.toString(), ...patient };
  }
  // Get all patients
  // Get all patients
  static async getAll() {
    const [rows] = await pool.query(`SELECT * FROM kidney_patients`);

    return rows.map((row) => {
      let videos = [];

      if (row.videos) {
        try {
          if (typeof row.videos === "string") {
            // If it's a string, try parsing JSON
            videos = JSON.parse(row.videos);
            if (!Array.isArray(videos)) videos = [videos];
          } else if (Array.isArray(row.videos)) {
            // Already an array
            videos = row.videos;
          } else {
            // Some other type, wrap in array
            videos = [row.videos];
          }
        } catch (err) {
          console.error("❌ Error parsing videos for patient id:", row.id, err);
          videos = [];
        }
      }

      return { ...row, videos };
    });
  }



  // Get patient by ID
  static async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM kidney_patients WHERE id = ? LIMIT 1`, [id]);

    if (rows.length === 0) return null;

    const row = rows[0];
    let videos = [];
    if (row.videos) {
      try {
        if (typeof row.videos === "string") {
          videos = JSON.parse(row.videos);
          if (!Array.isArray(videos)) videos = [videos];
        } else if (Array.isArray(row.videos)) {
          videos = row.videos;
        } else {
          videos = [row.videos];
        }
      } catch {
        videos = [];
      }
    }


    return { ...row, videos };
  }

  // Update patient
  static async update(id, patient) {
    await pool.query(
      `UPDATE kidney_patients 
       SET name=?, age=?, phone=?, whatsapp=?, telegram=?, email=?, facilityName=?, location=?, message=?, idDocument=?, medicalCertificate=?, videos=? 
       WHERE id=?`,
      [
        patient.name,
        patient.age,
        patient.phone,
        patient.whatsapp,
        patient.telegram,
        patient.email,
        patient.facilityName,
        patient.location,
        patient.message,
        patient.idDocument,
        patient.medicalCertificate,
        JSON.stringify(patient.videos || []),
        id,
      ]
    );
    return { _id: id.toString(), ...patient };
  }

  // Delete patient
  static async delete(id) {
    await pool.query(`DELETE FROM kidney_patients WHERE id = ?`, [id]);
    return { message: "Patient deleted successfully" };
  }
}

module.exports = KidneyPatient;



