require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL não configurada. Defina em .env antes de iniciar.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
