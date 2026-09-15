const { pool } = require("../config/db");

/**
 * Creates agent–provider link table and extends users.role enum for agent registration.
 */
const ensureAgentSupport = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_provider_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT NOT NULL,
        provider_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_agent_provider (agent_id, provider_id),
        KEY idx_agent_provider_agent (agent_id),
        KEY idx_agent_provider_provider (provider_id)
      )
    `);
    console.log("✅ agent_provider_links table ready");

    const [col] = await pool.query(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    if (!col.length) return;

    const typeDef = String(col[0].Type || "");
    if (typeDef.includes("standard_agent") && typeDef.includes("elite_agent")) {
      return;
    }

    await pool.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM(
        'individual','provider','corporate','diaspora','admin','super_admin',
        'marketing_admin','customer_support_admin','standard_agent','elite_agent'
      ) DEFAULT 'individual'
    `);
    console.log("✅ Extended users.role enum with standard_agent, elite_agent");
  } catch (err) {
    console.error("❌ ensureAgentSupport:", err.message);
  }
};

module.exports = ensureAgentSupport;
