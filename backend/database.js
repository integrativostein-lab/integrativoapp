require('dotenv').config();
const dns = require('dns');
const { Pool } = require('pg');
const { modoTeste } = require('./config/ambiente');

// Render e outros hosts podem falhar com ENETUNREACH em IPv6 para Supabase.
dns.setDefaultResultOrder('ipv4first');

// PostgreSQL exclusivamente (Supabase/Render/local). Não há suporte a SQLite.

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
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  lookup: (hostname, _options, callback) => {
    dns.lookup(hostname, { family: 4, all: false }, callback);
  }
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
