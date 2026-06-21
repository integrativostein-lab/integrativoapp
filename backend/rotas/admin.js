const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const auditoria = require('../servicos/auditoria-lgpd');

async function autenticarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const uResult = await db.query('SELECT tipo FROM usuarios WHERE id = $1', [d.id]);
    const u = uResult.rows[0];
    if (!u || !['admin', 'super_admin'].includes(u.tipo)) return res.status(403).json({ erro: 'Acesso restrito' });
    req.usuario = d;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarAdmin, async (req, res) => {
  const pac = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'");
  const ter = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('profissional','admin')");
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
  res.json({ pacientes: pac.rows[0].t, profissionais: ter.rows[0].t, faturamento_total: fat.rows[0].t });
});

router.get('/usuarios', autenticarAdmin, async (req, res) => {
  const r = await db.query('SELECT id, nome, email, tipo, plano, ativo FROM usuarios LIMIT 100');
  res.json(r.rows);
});

router.put('/usuarios/:id/status', autenticarAdmin, async (req, res) => {
  await db.query('UPDATE usuarios SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.ADMINISTRACAO,
    acao: 'alteracao_status_usuario',
    base_legal: auditoria.BASE_LEGAL.OBRIGACAO_LEGAL,
    finalidade: 'administração de contas e continuidade do serviço',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'usuario',
    recurso_id: req.params.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { ativo: req.body.ativo }
  });
  res.json({ mensagem: 'Status atualizado!' });
});

router.put('/usuarios/:id/plano', autenticarAdmin, async (req, res) => {
  await db.query('UPDATE usuarios SET plano = $1 WHERE id = $2', [req.body.plano, req.params.id]);
  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.ADMINISTRACAO,
    acao: 'alteracao_plano_usuario',
    base_legal: auditoria.BASE_LEGAL.EXECUCAO_CONTRATO,
    finalidade: 'gestão contratual de planos e bibliotecas',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'usuario',
    recurso_id: req.params.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { plano: req.body.plano }
  });
  res.json({ mensagem: 'Plano atualizado!' });
});

router.get('/logs', autenticarAdmin, async (req, res) => {
  try {
    const limite = Math.min(parseInt(req.query.limite, 10) || 200, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const resultado = await auditoria.listar({
      limite,
      offset,
      categoria: req.query.categoria || null,
      dataInicio: req.query.de || null,
      dataFim: req.query.ate || null,
      data: req.query.data || null
    });
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao listar logs de auditoria.', detalhe: error.message });
  }
});

router.get('/logs/arquivo', autenticarAdmin, async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);
  const { arquivo, eventos } = auditoria.lerArquivoPorData(data);
  res.json({
    data,
    arquivo,
    total: eventos.length,
    eventos: eventos.map(auditoria.normalizarEventoArquivo)
  });
});

router.get('/logs/arquivos', autenticarAdmin, async (req, res) => {
  res.json(auditoria.listarArquivosDisponiveis());
});

module.exports = router;