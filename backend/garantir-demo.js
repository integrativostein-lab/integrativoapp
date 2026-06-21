#!/usr/bin/env node
/**
 * Garante contas e valores demo para agendamento/teleconsulta.
 * Uso: node garantir-demo.js
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./database');
const { garantirValoresPadrao } = require('./utils/profissional-valores');

const CONTAS = [
  {
    nome: 'Dr. João Integrativo',
    email: 'profissional@demo.com',
    senha: 'demo123',
    tipo: 'profissional',
    especialidades: JSON.stringify(['Fitoterapia', 'Ayurveda', 'Medicina Integrativa']),
    atende_online: 1,
    atende_presencial: 1,
    plano: 'premium'
  },
  {
    nome: 'Maria Paciente',
    email: 'paciente@demo.com',
    senha: 'demo123',
    tipo: 'paciente',
    plano: 'freemium'
  }
];

async function upsertUsuario(conta) {
  const existente = await db.query('SELECT id, tipo FROM usuarios WHERE email = $1', [conta.email]);
  if (existente.rows.length) {
    const id = existente.rows[0].id;
    await db.query(
      `UPDATE usuarios SET ativo = 1, atende_online = COALESCE($2, atende_online), atende_presencial = COALESCE($3, atende_presencial),
       especialidades = COALESCE($4, especialidades), plano = COALESCE($5, plano) WHERE id = $1`,
      [id, conta.atende_online ?? null, conta.atende_presencial ?? null, conta.especialidades ?? null, conta.plano ?? null]
    );
    if (conta.tipo === 'paciente') {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [id]).catch(() => {});
    }
    return id;
  }

  const hash = await bcrypt.hash(conta.senha, 12);
  const r = await db.query(
    `INSERT INTO usuarios (nome, email, senha, tipo, especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento, plano, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), $8, 1)
     RETURNING id`,
    [
      conta.nome,
      conta.email,
      hash,
      conta.tipo,
      conta.especialidades || null,
      conta.atende_online || 0,
      conta.atende_presencial || 0,
      conta.plano || 'freemium'
    ]
  );
  const id = r.rows[0].id;
  if (conta.tipo === 'paciente') {
    await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [id]).catch(() => {});
  }
  return id;
}

async function main() {
  console.log('🔧 Garantindo contas demo...\n');

  const ids = {};
  for (const conta of CONTAS) {
    ids[conta.tipo] = await upsertUsuario(conta);
    console.log(`✅ ${conta.email} (id ${ids[conta.tipo]})`);
  }

  const valorId = await garantirValoresPadrao(ids.profissional);
  console.log(valorId
    ? `✅ Valores do profissional demo configurados (registro ${valorId})`
    : '⚠️ Não foi possível criar profissional_valores — verifique tabela especialidades');

  console.log('\nCredenciais demo:');
  console.log('  profissional@demo.com / demo123');
  console.log('  paciente@demo.com / demo123');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
