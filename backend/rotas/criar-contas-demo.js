const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// Rota para criar contas de demonstração (apenas em desenvolvimento)
router.post('/criar', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ erro: 'Disponível apenas em desenvolvimento' });
  }

  const contas = [
    { nome: 'Dr. João Fitoterapeuta', email: 'joao@teste.com', senha: 'Teste@123', tipo: 'profissional', especialidades: '["Fitoterapia","Ayurveda"]', plano: 'pro', atende_online: 1, atende_presencial: 1 },
    { nome: 'Dra. Ana Massoterapeuta', email: 'ana@teste.com', senha: 'Teste@123', tipo: 'profissional', especialidades: '["Massoterapia","Aromaterapia"]', plano: 'premium', atende_online: 0, atende_presencial: 1 },
    { nome: 'Clínica Vida Integrativa', email: 'clinica@teste.com', senha: 'Teste@123', tipo: 'admin', especialidades: '["Fitoterapia","Yoga","MTC"]', plano: 'enterprise', atende_online: 1, atende_presencial: 1, cnpj: '12345678000190' },
    { nome: 'Maria Paciente', email: 'maria@teste.com', senha: 'Teste@123', tipo: 'paciente' },
    { nome: 'Pedro Paciente', email: 'pedro@teste.com', senha: 'Teste@123', tipo: 'paciente' }
  ];

  const criadas = [];
  for (const c of contas) {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [c.email]);
    if (existe.rows.length > 0) {
      criadas.push({ email: c.email, status: 'já existia' });
      continue;
    }

    const hash = await bcrypt.hash(c.senha, 12);
    await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, especialidades, plano, atende_online, atende_presencial, cnpj, lgpd_consentimento, lgpd_data_consentimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,NOW())`,
      [c.nome, c.email, hash, c.tipo, c.especialidades || null, c.plano || 'freemium', c.atende_online || 0, c.atende_presencial || 0, c.cnpj || null]
    );

    if (c.tipo === 'paciente') {
      const u = await db.query('SELECT id FROM usuarios WHERE email = $1', [c.email]);
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [u.rows[0].id]);
    }

    criadas.push({ email: c.email, status: 'criada' });
  }

  res.json({ mensagem: 'Contas demo processadas', contas: criadas });
});

module.exports = router;