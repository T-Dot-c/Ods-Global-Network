const { pool } = require("../config/db");

const AGENT_ROLES = ["standard_agent", "elite_agent"];
const LINK_LIMIT = { standard_agent: 35, elite_agent: 500 };

function assertAgent(req, res) {
  if (!req.user || !AGENT_ROLES.includes(req.user.role)) {
    res.status(403).json({ msg: "Agent access only" });
    return false;
  }
  return true;
}

/** Professionals (providers) who have at least one active listed service */
exports.listProfessionals = async (req, res) => {
  if (!assertAgent(req, res)) return;
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.fullName, u.email, u.companyName, u.serviceType, u.city, u.phone,
              COUNT(s.id) AS serviceCount
       FROM users u
       INNER JOIN services s ON s.providerId = u.id AND (s.isActive = 1 OR s.isActive IS NULL)
       WHERE u.role IN ('provider', 'corporate')
       GROUP BY u.id, u.fullName, u.email, u.companyName, u.serviceType, u.city, u.phone
       ORDER BY u.fullName ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("listProfessionals:", err);
    res.status(500).json({ msg: "Failed to list professionals" });
  }
};

exports.listLinkedProfessionals = async (req, res) => {
  if (!assertAgent(req, res)) return;
  try {
    const agentId = req.user.id;
    const [rows] = await pool.query(
      `SELECT u.id, u.fullName, u.email, u.companyName, u.serviceType, u.city, u.phone,
              l.created_at AS linkedAt
       FROM agent_provider_links l
       JOIN users u ON u.id = l.provider_id
       WHERE l.agent_id = ?
       ORDER BY l.created_at DESC`,
      [agentId]
    );
    res.json(rows);
  } catch (err) {
    console.error("listLinkedProfessionals:", err);
    res.status(500).json({ msg: "Failed to list linked professionals" });
  }
};

exports.linkProvider = async (req, res) => {
  if (!assertAgent(req, res)) return;
  const agentId = req.user.id;
  const role = req.user.role;
  const rawId = req.body.providerId ?? req.body.provider_id;
  const providerId = parseInt(String(rawId), 10);
  if (!providerId || Number.isNaN(providerId)) {
    return res.status(400).json({ msg: "Valid providerId is required" });
  }

  try {
    const [prov] = await pool.query(
      "SELECT id, role FROM users WHERE id = ?",
      [providerId]
    );
    const p = prov[0];
    if (!p || !["provider", "corporate"].includes(p.role)) {
      return res.status(400).json({ msg: "User is not a service provider" });
    }
    if (p.id === agentId) {
      return res.status(400).json({ msg: "Cannot link yourself" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM agent_provider_links WHERE agent_id = ? AND provider_id = ?",
      [agentId, providerId]
    );
    if (existing.length) {
      return res.status(200).json({ msg: "Already linked", linked: true });
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS c FROM agent_provider_links WHERE agent_id = ?",
      [agentId]
    );
    const limit = LINK_LIMIT[role] ?? 35;
    if (countRows[0].c >= limit) {
      return res.status(403).json({
        msg:
          role === "elite_agent"
            ? "Link limit reached. Contact support if you need more."
            : "Standard agents have a limited number of linked professionals. Upgrade to Elite for a higher limit.",
      });
    }

    await pool.query(
      "INSERT INTO agent_provider_links (agent_id, provider_id) VALUES (?, ?)",
      [agentId, providerId]
    );
    res.status(201).json({ msg: "Professional linked", linked: true });
  } catch (err) {
    console.error("linkProvider:", err);
    res.status(500).json({ msg: "Failed to link professional" });
  }
};

exports.unlinkProvider = async (req, res) => {
  if (!assertAgent(req, res)) return;
  const agentId = req.user.id;
  const providerId = parseInt(String(req.params.providerId), 10);
  if (!providerId) {
    return res.status(400).json({ msg: "Invalid provider id" });
  }
  try {
    await pool.query(
      "DELETE FROM agent_provider_links WHERE agent_id = ? AND provider_id = ?",
      [agentId, providerId]
    );
    res.json({ msg: "Unlinked" });
  } catch (err) {
    console.error("unlinkProvider:", err);
    res.status(500).json({ msg: "Failed to unlink" });
  }
};
