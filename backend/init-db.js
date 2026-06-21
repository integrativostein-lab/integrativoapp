require('dotenv').config();
const db = require('./database');

async function verificarConexaoPostgres() {
  await db.query('SELECT 1');
  console.log('✅ Conexão PostgreSQL (Supabase) OK');
}

verificarConexaoPostgres()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha na conexão PostgreSQL:', err.message);
    process.exit(1);
  });