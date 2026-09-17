const { pool } = require("../config/db");

async function sanitizeServiceTags() {
  try {
    console.log("🔍 Checking for services with invalid tag JSON...");

    const [rows] = await pool.query(
      `SELECT id, CAST(tags AS CHAR) AS tags
       FROM services
       WHERE tags IS NOT NULL AND tags <> ''`
    );

    if (!rows.length) {
      console.log("✅ No services with tags to sanitize");
      return;
    }

    let updatedCount = 0;

    for (const row of rows) {
      const rawTags = typeof row.tags === "string" ? row.tags.trim() : "";

      if (!rawTags) {
        continue;
      }

      let isValidJson = true;
      try {
        JSON.parse(rawTags);
      } catch (err) {
        isValidJson = false;
      }

      if (!isValidJson) {
        const normalizedTags = JSON.stringify([rawTags]);

        try {
          await pool.query(
            `UPDATE services SET tags = ? WHERE id = ?`,
            [normalizedTags, row.id]
          );
          updatedCount += 1;
          console.log(`✅ Normalized tags for service ${row.id} -> ${normalizedTags}`);
        } catch (updateErr) {
          console.error(`❌ Failed to normalize tags for service ${row.id}:`, updateErr.message);
        }
      }
    }

    if (updatedCount === 0) {
      console.log("✅ All service tags are already valid JSON");
    } else {
      console.log(`✅ Normalized tags for ${updatedCount} service(s)`);
    }
  } catch (err) {
    console.error("❌ Error sanitizing service tags:", err.message);
  }
}

module.exports = { sanitizeServiceTags };






































