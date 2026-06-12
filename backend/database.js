require('dotenv').config();
const { Pool } = require('pg');
const { modoTeste } = require('./config/ambiente');

const connectionString = modoTeste && process.env.TESTE_DATABASE_URL
  ? process.env.TESTE_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FATAL] DATABASE_URL não configurada. Defina em .env antes de iniciar.');
  process.exit(1);
}

if (modoTeste && !process.env.TESTE_DATABASE_URL) {
  console.warn('[DB] Ambiente de teste ativo sem TESTE_DATABASE_URL. Usando DATABASE_URL atual.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  modoTeste,
  usandoBancoTeste: modoTeste && !!process.env.TESTE_DATABASE_URL
};
