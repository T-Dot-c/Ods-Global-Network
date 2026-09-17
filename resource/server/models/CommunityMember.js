// models/CommunityMember.js
const { pool } = require("../config/db");

class CommunityMember {
  constructor({
    memberType,
    name,
    email,
    phone = null,
    whatsapp = null,
    location = null,
    specialization,
    cvUrl,
    credentialsUrl,
  }) {
    this.memberType = memberType;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.whatsapp = whatsapp;
    this.location = location;
    this.specialization = specialization;
    this.cvUrl = cvUrl;
    this.credentialsUrl = credentialsUrl;
  }

  // Save new member
  async save() {
    const [result] = await pool.query(
      `INSERT INTO community_members
        (memberType, name, email, phone, whatsapp, location, specialization, cvUrl, credentialsUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.memberType,
        this.name,
        this.email,
        this.phone,
        this.whatsapp,
        this.location,
        this.specialization,
        this.cvUrl,
        this.credentialsUrl,
      ]
    );

    return result.insertId; // return the newly created ID
  }

  // Static method: get all members
  static async getAll() {
    const [rows] = await pool.query(
      `SELECT * FROM community_members ORDER BY createdAt DESC`
    );
    return rows;
  }

  // Static method: get a member by ID
  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM community_members WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = CommunityMember;
