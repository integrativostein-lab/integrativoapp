#!/usr/bin/env node
/**
 * Garante contas demo e personas para testers alfa.
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
const SENHA_DEMO = 'demo123';

const CONTAS = [
  {
    chave: 'profissional',
    nome: 'Dr. João Integrativo',
    email: 'profissional@demo.com',
    tipo: 'profissional',
    persona: 'Médico integrativo — todas as bibliotecas',
    especialidades: TODAS_BIBLIOTECAS,
    atende_online: 1,
    atende_presencial: 1,
    plano: 'enterprise',
    telefone: '11999990001',
    cidade: 'São Paulo',
    conselho_profissional: 'CRM',
    numero_registro: '123456-SP'
  },
  {
    chave: 'prof_ana',
    nome: 'Dra. Ana Souza',
    email: 'dra.ana@demo.com',
    tipo: 'profissional',
    persona: 'Ayurveda e fitoterapia — perfil holístico',
    especialidades: ['Ayurveda', 'Fitoterapia', 'Yoga Terapêutico', 'Medicina Integrativa'],
    atende_online: 1,
    atende_presencial: 1,
    plano: 'enterprise',
    telefone: '11999990002',
    cidade: 'Curitiba',
    conselho_profissional: 'CRM',
    numero_registro: '234567-PR'
  },
  {
    chave: 'prof_carlos',
    nome: 'Dr. Carlos Mendes',
    email: 'dr.carlos@demo.com',
    tipo: 'profissional',
    persona: 'MTC e acupuntura — dor crônica',
    especialidades: ['MTC', 'Acupuntura', 'Medicina Integrativa'],
    atende_online: 1,
    atende_presencial: 0,
    plano: 'enterprise',
    telefone: '11999990003',
    cidade: 'Belo Horizonte',
    conselho_profissional: 'CRM',
    numero_registro: '345678-MG'
  },
  {
    chave: 'prof_rita',
    nome: 'Dra. Rita Oliveira',
    email: 'dra.rita@demo.com',
    tipo: 'profissional',
    persona: 'Naturopatia e homeopatia — saúde da mulher',
    especialidades: ['Naturopatia', 'Homeopatia', 'Fitoterapia'],
    atende_online: 1,
    atende_presencial: 1,
    plano: 'enterprise',
    telefone: '11999990004',
    cidade: 'Porto Alegre',
    conselho_profissional: 'CRM',
    numero_registro: '456789-RS'
  },
  {
    chave: 'paciente',
    nome: 'Maria Paciente',
    email: 'paciente@demo.com',
    tipo: 'paciente',
    persona: 'Paciente geral — consultas e agenda',
    plano: 'freemium',
    telefone: '11988880001',
    cidade: 'São Paulo'
  },
  {
    chave: 'pac_carlos',
    nome: 'Carlos Silva',
    email: 'carlos.paciente@demo.com',
    tipo: 'paciente',
    persona: '45 anos — hipertensão e estresse no trabalho',
    plano: 'freemium',
    telefone: '11988880002',
    cidade: 'São Paulo'
  },
  {
    chave: 'pac_ana',
    nome: 'Ana Costa',
    email: 'ana.paciente@demo.com',
    tipo: 'paciente',
    persona: '32 anos — ansiedade, insônia e TPM',
    plano: 'freemium',
    telefone: '11988880003',
    cidade: 'Curitiba'
  },
  {
    chave: 'pac_joao',
    nome: 'João Pereira',
    email: 'joao.paciente@demo.com',
    tipo: 'paciente',
    persona: '58 anos — diabetes tipo 2 e dor nas articulações',
    plano: 'freemium',
    telefone: '11988880004',
    cidade: 'Belo Horizonte'
  },
  {
    chave: 'admin',
    nome: 'Admin Integrativo',
    email: 'admin@integra.com',
    senha: 'admin123',
    tipo: 'super_admin',
    persona: 'Administrador técnico',
    plano: 'enterprise'
  }
];

function jsonEspecialidades(lista) {
  if (!lista) return null;
  return JSON.stringify(lista);
}

async function upsertUsuario(conta) {
  const hash = await bcrypt.hash(conta.senha || SENHA_DEMO, 12);
  const esp = jsonEspecialidades(conta.especialidades);
  const existente = await db.query('SELECT id FROM usuarios WHERE email = $1', [conta.email]);

  if (existente.rows.length) {
    const id = existente.rows[0].id;
    await db.query(
      `UPDATE usuarios SET ativo = 1, senha = $2, tipo = $3, nome = $4,
       telefone = COALESCE($5, telefone), cidade = COALESCE($6, cidade),
       conselho_profissional = COALESCE($7, conselho_profissional),
       numero_registro = COALESCE($8, numero_registro),
       atende_online = COALESCE($9, atende_online), atende_presencial = COALESCE($10, atende_presencial),
       especialidades = COALESCE($11, especialidades), plano = COALESCE($12, plano) WHERE id = $1`,
      [
        id, hash, conta.tipo, conta.nome,
        conta.telefone ?? null, conta.cidade ?? null,
        conta.conselho_profissional ?? null, conta.numero_registro ?? null,
        conta.atende_online ?? null, conta.atende_presencial ?? null,
        esp, conta.plano ?? null
      ]
    );
    if (conta.tipo === 'paciente') {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [id]).catch(() => {});
    }
    return id;
  }

  const r = await db.query(
    `INSERT INTO usuarios (nome, email, senha, tipo, telefone, cidade, conselho_profissional, numero_registro,
      especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento, plano, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, NOW(), $12, 1)
     RETURNING id`,
    [
      conta.nome, conta.email, hash, conta.tipo,
      conta.telefone || null, conta.cidade || null,
      conta.conselho_profissional || null, conta.numero_registro || null,
      esp, conta.atende_online || 0, conta.atende_presencial || 0,
      conta.plano || 'freemium'
    ]
  );
  const id = r.rows[0].id;
  if (conta.tipo === 'paciente') {
    await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [id]).catch(() => {});
  }
  return id;
}

async function garantirAgendamentoDemo(pacienteId, profissionalId, data, horario, modalidade) {
  const dup = await db.query(
    `SELECT id FROM agendamentos WHERE paciente_id = $1 AND profissional_id = $2 AND data_agendamento = $3 AND horario_inicio = $4 LIMIT 1`,
    [pacienteId, profissionalId, data, horario]
  );
  if (dup.rows.length) return dup.rows[0].id;

  const ins = await db.query(
    `INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento, horario_inicio, modalidade, status)
     VALUES ($1, $2, $3, $4, $5, 'agendado')
     RETURNING id`,
    [pacienteId, profissionalId, data, horario, modalidade]
  ).catch(() => ({ rows: [] }));
  return ins.rows[0]?.id || null;
}

async function criarAgendamentosPersonas(ids) {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 2);
  const data = amanha.toISOString().split('T')[0];

  const pares = [
    ['paciente', 'profissional', '09:00', 'online'],
    ['pac_carlos', 'prof_carlos', '10:00', 'online'],
    ['pac_ana', 'prof_ana', '11:00', 'online'],
    ['pac_joao', 'prof_rita', '14:00', 'presencial'],
    ['pac_ana', 'profissional', '15:00', 'online']
  ];

  let criados = 0;
  for (const [pacChave, profChave, hora, mod] of pares) {
    const pid = ids[pacChave];
    const fid = ids[profChave];
    if (!pid || !fid) continue;
    const agId = await garantirAgendamentoDemo(pid, fid, data, hora, mod);
    if (agId) criados++;
  }
  return criados;
}

async function main() {
  console.log('🔧 Garantindo contas demo e personas alfa...\n');
  console.log(`   📚 Bibliotecas do profissional principal: ${TODAS_BIBLIOTECAS.length}\n`);

  const ids = {};
  for (const conta of CONTAS) {
    ids[conta.chave] = await upsertUsuario(conta);
    console.log(`✅ ${conta.email} — ${conta.persona || conta.tipo} (id ${ids[conta.chave]})`);
  }

  for (const conta of CONTAS.filter((c) => c.tipo === 'profissional')) {
    const valorId = await garantirValoresPadrao(ids[conta.chave]);
    console.log(valorId
      ? `   💰 Valores de ${conta.email} (registro ${valorId})`
      : `   ⚠️ Valores não criados para ${conta.email}`);
  }

  const agCount = await criarAgendamentosPersonas(ids);
  console.log(`\n📅 Agendamentos demo entre personas: ${agCount}`);

  console.log('\n── Credenciais (senha: demo123) ──');
  console.log('\nProfissionais:');
  CONTAS.filter((c) => c.tipo === 'profissional').forEach((c) => {
    console.log(`  ${c.email} — ${c.persona}`);
  });
  console.log('\nPacientes (personas):');
  CONTAS.filter((c) => c.tipo === 'paciente').forEach((c) => {
    console.log(`  ${c.email} — ${c.persona}`);
  });
  console.log('\nAdmin: admin@integra.com / admin123');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
