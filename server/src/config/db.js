require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const sql = require('mssql');

const trusted = process.env.DB_TRUSTED === 'true';

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'pos_db',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE || undefined,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

// Use Windows Auth (trusted) or SQL Auth
if (trusted) {
  config.driver = 'msnodesqlv8';
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASS;
}

let pool;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
    console.log(`SQL Server connected (${trusted ? 'Windows Auth' : 'SQL Auth'})`);
  }
  return pool;
};

module.exports = { getPool, sql };
