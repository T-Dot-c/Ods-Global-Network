// models/PartnerRequest.js
const { pool } = require('../config/db');

class PartnerRequest {
  constructor(data) {
    Object.assign(this, data);
  }

  // Save new request
  async save() {
    const query = `
    INSERT INTO partner_requests
    (tab, investmentType, sector, name, companyName, email, phone, officePhone, whatsapp, enquiry, motto, specialPackages, messages, coBrand, effectiveDate, expiryDate, idOrPassport, license, tradeRegistration, businessProposal, businessPlan, logo, mouSigned, contractSigned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
      this.tab,
      Array.isArray(this.investmentType) ? this.investmentType[0] : this.investmentType, // ✅ plain text
      this.sector,
      this.name,
      this.companyName,
      this.email,
      this.phone,
      this.officePhone,
      this.whatsapp,
      this.enquiry,
      this.motto,
      this.specialPackages,
      this.messages,
      this.coBrand,
      this.effectiveDate,
      this.expiryDate,
      this.idOrPassport,
      this.license,
      this.tradeRegistration,
      this.businessProposal,
      this.businessPlan,
      this.logo,
      this.mouSigned,
      this.contractSigned,
    ];

    const [result] = await pool.query(query, params);
    this.id = result.insertId;
    return this;
  }


  // Fetch all requests
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM partner_requests ORDER BY createdAt DESC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM partner_requests WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  }
}

module.exports = PartnerRequest;
