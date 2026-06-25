#!/usr/bin/env node
/**
 * Garante contas e valores demo para agendamento/teleconsulta.
 * Uso: node garantir-demo.js
 */
require('dotenv').config();

const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { garantirValoresPadrao } = require('./utils/profissional-valores');

function carregarTodasBibliotecas() {
  try {
    const CONFIG = require(path.join(__dirname, '../frontend/js/config.js'));
    const itens = CONFIG.BIBLIOTECAS_TERAPEUTICAS?.itens || [];
    if (itens.length) return itens;
  } catch (err) {
    console.warn('   ⚠️ Catálogo completo indisponível:', err.message);
  }
  return ['Fitoterapia', 'Ayurveda', 'Medicina Integrativa', 'MTC', 'Naturopatia'];
}

const TODAS_BIBLIOTECAS = carregarTodasBibliotecas();

const CONTAS = [
  {
    nome: 'Dr. João Integrativo',
    email: 'profissional@demo.com',
    senha: 'demo123',
    tipo: 'profissional',
    especialidades: JSON.stringify(TODAS_BIBLIOTECAS),
    atende_online: 1,
    atende_presencial: 1,
    plano: 'enterprise'
  },
  {
    nome: 'Maria Paciente',
    email: 'paciente@demo.com',
    senha: 'demo123',
    tipo: 'paciente',
    plano: 'freemium'
  },
  {
    nome: 'Admin Integrativo',
    email: 'admin@integra.com',
    senha: 'admin123',
    tipo: 'super_admin',
    plano: 'enterprise'
  }
];

async function upsertUsuario(conta) {
  const existente = await db.query('SELECT id, tipo FROM usuarios WHERE email = $1', [conta.email]);
  if (existente.rows.length) {
    const id = existente.rows[0].id;
    const hash = await bcrypt.hash(conta.senha, 12);
    await db.query(
      `UPDATE usuarios SET ativo = 1, senha = $2, tipo = $3,
       atende_online = COALESCE($4, atende_online), atende_presencial = COALESCE($5, atende_presencial),
       especialidades = COALESCE($6, especialidades), plano = COALESCE($7, plano) WHERE id = $1`,
      [
        id,
        hash,
        conta.tipo,
        conta.atende_online ?? null,
        conta.atende_presencial ?? null,
        conta.especialidades ?? null,
        conta.plano ?? null
      ]
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
  console.log(`   📚 Bibliotecas do profissional demo: ${TODAS_BIBLIOTECAS.length}\n`);

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
  console.log('  admin@integra.com / admin123 (super_admin)');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
