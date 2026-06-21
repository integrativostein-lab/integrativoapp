#!/usr/bin/env node
/**
 * Aplica migracoes LGPD no PostgreSQL (Supabase/Render).
 * Uso: node scripts/aplicar-migracoes-lgpd.js
 * Requer DATABASE_URL em backend/.env ou variavel de ambiente.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = require(path.join(__dirname, '../backend/node_modules/pg'));

const MIGRATIONS = [
  '../migracao-auditoria-lgpd.sql',
  '../migracao-consentimentos-lgpd.sql'
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL não definida. Configure backend/.env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
  });

  console.log('🔄 Aplicando migracoes LGPD...\n');

  for (const rel of MIGRATIONS) {
    const file = path.join(__dirname, rel);
    const sql = fs.readFileSync(file, 'utf8');
    const name = path.basename(file);
    process.stdout.write(`→ ${name} ... `);
    await pool.query(sql);
    console.log('ok');
  }

  await pool.end();
  console.log('\n✅ Migracoes LGPD aplicadas com sucesso.');
}

main().catch((err) => {
  console.error('\n❌ Falha:', err.message);
  process.exit(1);
});
