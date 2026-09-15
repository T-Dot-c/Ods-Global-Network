const { pool } = require("../config/db");

const CERTIFICATE_TABLES = [
  "community_members",
  "premium_memberships",
];

async function getMaxCertificateFromTable(executor, tableName) {
  try {
    const [[{ maxNumber }]] = await executor.query(
      `SELECT MAX(CAST(certificateNumber AS UNSIGNED)) AS maxNumber
       FROM ${tableName}
       WHERE certificateNumber IS NOT NULL
         AND certificateNumber <> ''`
    );
    return maxNumber || 0;
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return 0;
    }
    throw error;
  }
}

async function generateCertificateNumber(connection = null) {
  const executor = connection || pool;

  let maxFound = 0;
  for (const tableName of CERTIFICATE_TABLES) {
    const tableMax = await getMaxCertificateFromTable(executor, tableName);
    if (tableMax > maxFound) {
      maxFound = tableMax;
    }
  }

  const nextNumber = maxFound + 1;

  if (nextNumber > 9999) {
    throw new Error("Certificate number limit reached (maximum 9999).");
  }

  return String(nextNumber).padStart(4, "0");
}

module.exports = {
  generateCertificateNumber,
};




