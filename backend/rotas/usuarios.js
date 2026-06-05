const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/perfil', autenticar, async (req, res) => {
  const r = await db.query('SELECT id, nome, email, telefone, cpf, tipo, registro_profissional, conselho_classe, uf_conselho, registro_abrath, cnpj, cidade, estado, especialidades, atende_online, atende_presencial, plano, certificado_digital_senha FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (r.rows.length === 0) return res.status(404).json({ erro: 'Não encontrado' });
  const u = r.rows[0];
  if (u.tipo === 'paciente') {
    const p = await db.query('SELECT * FROM pacientes WHERE usuario_id = $1', [req.usuario.id]);
    u.dados_saude = p.rows[0] || null;
  }
  res.json(u);
});

router.put('/perfil', autenticar, async (req, res) => {
  const campos = ['nome', 'telefone', 'registro_profissional', 'conselho_classe', 'uf_conselho', 'registro_abrath', 'cnpj', 'cidade', 'estado', 'especialidades', 'atende_online', 'atende_presencial', 'certificado_digital_senha'];
  const att = {};
  campos.forEach(c => { if (req.body[c] !== undefined) att[c] = req.body[c]; });
  if (Object.keys(att).length === 0) return res.status(400).json({ erro: 'Nada para atualizar' });

  const sets = Object.keys(att).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = Object.values(att);
  vals.push(req.usuario.id);
  await db.query(`UPDATE usuarios SET ${sets}, atualizado_em = NOW() WHERE id = $${vals.length}`, vals);
  res.json({ mensagem: 'Perfil atualizado!' });
});

router.put('/senha', autenticar, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  const r = await db.query('SELECT senha FROM usuarios WHERE id = $1', [req.usuario.id]);
  const ok = await bcrypt.compare(senha_atual, r.rows[0].senha);
  if (!ok) return res.status(400).json({ erro: 'Senha atual incorreta' });
  const hash = await bcrypt.hash(nova_senha, 12);
  await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hash, req.usuario.id]);
  res.json({ mensagem: 'Senha atualizada!' });
});

router.put('/configurar-loja', autenticar, async (req, res) => {
  const { loja_ativa, nome_loja } = req.body;
  const config = JSON.stringify({ loja_ativa: loja_ativa !== false, nome_loja: nome_loja || 'Minha Loja' });
  const ex = await db.query("SELECT id FROM configuracoes WHERE chave = 'loja_config' AND usuario_id = $1", [req.usuario.id]);
  if (ex.rows.length > 0) await db.query('UPDATE configuracoes SET valor = $1 WHERE id = $2', [config, ex.rows[0].id]);
  else await db.query('INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ($1, $2, $3)', ['loja_config', config, req.usuario.id]);
  res.json({ mensagem: 'Loja configurada!' });
});

router.get('/status-loja', autenticar, async (req, res) => {
  const c = await db.query("SELECT valor FROM configuracoes WHERE chave = 'loja_config' AND usuario_id = $1", [req.usuario.id]);
  res.json(c.rows.length > 0 ? JSON.parse(c.rows[0].valor) : { loja_ativa: false });
});

router.put('/configurar-anamnese-parte1', autenticar, async (req, res) => {
  const { especialidade_id, campos_ativos, campos_obrigatorios } = req.body;
  const ex = await db.query('SELECT id FROM config_anamnese_parte1 WHERE usuario_id = $1 AND especialidade_id = $2', [req.usuario.id, especialidade_id]);
  if (ex.rows.length > 0) {
    await db.query('UPDATE config_anamnese_parte1 SET campos_ativos = $1, campos_obrigatorios = $2 WHERE id = $3', [JSON.stringify(campos_ativos), JSON.stringify(campos_obrigatorios), ex.rows[0].id]);
  } else {
    await db.query('INSERT INTO config_anamnese_parte1 (usuario_id, especialidade_id, campos_ativos, campos_obrigatorios) VALUES ($1, $2, $3, $4)', [req.usuario.id, especialidade_id, JSON.stringify(campos_ativos), JSON.stringify(campos_obrigatorios)]);
  }
  res.json({ mensagem: 'Formulário personalizado salvo!' });
});

router.get('/listar', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'admin' && req.usuario.tipo !== 'super_admin') return res.status(403).json({ erro: 'Acesso negado' });
  const r = await db.query('SELECT id, nome, email, tipo, plano, ativo, criado_em FROM usuarios ORDER BY criado_em DESC LIMIT 100');
  res.json(r.rows);
});

module.exports = router;