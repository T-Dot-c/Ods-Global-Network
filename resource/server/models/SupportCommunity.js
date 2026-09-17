// models/SupportCommunity.js
const { pool } = require("../config/db");

class SupportCommunity {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const [result] = await pool.query(
      `INSERT INTO support_community 
      (membershipId, name, email, phone, region, whatsapp, telegram, supportTypes, message, userType, roles, influencerTier, influencerRoles, brandAmbassadorTier, brandAmbassadorRoles, serviceProviderTier, volunteerTier, digitalCreatorTier, digitalCreatorRoles, digitalCreatorPhotos, digitalCreatorVideos, digitalCreatorDocs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.membershipId,
        this.name,
        this.email,
        this.phone || null,
        this.region || null,
        this.whatsapp || null,
        this.telegram || null,
        JSON.stringify(this.supportTypes || []),
        this.message || null,
        this.userType || null,
        JSON.stringify(this.roles || []),
        this.influencerTier || null,
        JSON.stringify(this.influencerRoles || []),
        this.brandAmbassadorTier || null,
        JSON.stringify(this.brandAmbassadorRoles || []),
        this.serviceProviderTier || null,
        this.volunteerTier || null,
        this.digitalCreatorTier || null,
        JSON.stringify(this.digitalCreatorRoles || []),
        JSON.stringify(this.digitalCreatorPhotos || []),
        JSON.stringify(this.digitalCreatorVideos || []),
        JSON.stringify(this.digitalCreatorDocs || []),
      ]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.query(`SELECT * FROM support_community ORDER BY createdAt DESC`);
    return rows.map(row => ({
      ...row,
      supportTypes: row.supportTypes ? JSON.parse(row.supportTypes) : [],
      roles: row.roles ? JSON.parse(row.roles) : [],
      influencerRoles: row.influencerRoles ? JSON.parse(row.influencerRoles) : [],
      brandAmbassadorRoles: row.brandAmbassadorRoles ? JSON.parse(row.brandAmbassadorRoles) : [],
      digitalCreatorRoles: row.digitalCreatorRoles ? JSON.parse(row.digitalCreatorRoles) : [],
      digitalCreatorPhotos: row.digitalCreatorPhotos ? JSON.parse(row.digitalCreatorPhotos) : [],
      digitalCreatorVideos: row.digitalCreatorVideos ? JSON.parse(row.digitalCreatorVideos) : [],
      digitalCreatorDocs: row.digitalCreatorDocs ? JSON.parse(row.digitalCreatorDocs) : [],
    }));
  }

  static async getByMembershipId(membershipId) {
    const [rows] = await pool.query(`SELECT * FROM support_community WHERE membershipId = ?`, [membershipId]);
    if (!rows.length) return null;
    const row = rows[0];
    return {
      ...row,
      supportTypes: row.supportTypes ? JSON.parse(row.supportTypes) : [],
      roles: row.roles ? JSON.parse(row.roles) : [],
      influencerRoles: row.influencerRoles ? JSON.parse(row.influencerRoles) : [],
      brandAmbassadorRoles: row.brandAmbassadorRoles ? JSON.parse(row.brandAmbassadorRoles) : [],
      digitalCreatorRoles: row.digitalCreatorRoles ? JSON.parse(row.digitalCreatorRoles) : [],
      digitalCreatorPhotos: row.digitalCreatorPhotos ? JSON.parse(row.digitalCreatorPhotos) : [],
      digitalCreatorVideos: row.digitalCreatorVideos ? JSON.parse(row.digitalCreatorVideos) : [],
      digitalCreatorDocs: row.digitalCreatorDocs ? JSON.parse(row.digitalCreatorDocs) : [],
    };
  }
}

module.exports = SupportCommunity;





