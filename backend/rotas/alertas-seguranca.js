const express = require('express');
const jwt = require('jsonwebtoken');
const motor = require('../servicos/alertas-seguranca');
const auditoria = require('../servicos/auditoria-lgpd');

const router = express.Router();

function autenticarOpcional(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.usuario = null;
  }
  next();
}

function autenticarObrigatorio(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

function exigirAdmin(req, res, next) {
  if (!['admin', 'super_admin'].includes(req.usuario?.tipo)) {
    return res.status(403).json({ erro: 'Acesso restrito' });
  }
  next();
}

function registrarAuditoria(req, resultado, origem) {
  const regras = (resultado.alertas || []).map((alerta) => alerta.regra_id).join(',') || 'sem_alerta';
  const termo = String(req.query?.termo || req.body?.termo || req.body?.pratica || req.body?.produto || '')
    .slice(0, 80)
    .replace(/\s+/g, ' ');
  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.SEGURANCA_CLINICA,
    acao: 'verificacao_alertas',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'consulta determinística de alertas de segurança clínica',
    usuario_id: req.usuario?.id ?? null,
    usuario_tipo: req.usuario?.tipo ?? null,
    email: req.usuario?.email ?? null,
    recurso: 'alertas_seguranca',
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: {
      origem,
      maior_gravidade: resultado.maior_gravidade,
      regras,
      termo: termo || null
    }
  });
}

router.get('/regras', autenticarObrigatorio, exigirAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    motor: 'deterministico_if_then',
    usa_ia: false,
    total: motor.REGRAS_SEGURANCA.length,
    regras: motor.REGRAS_SEGURANCA.map((regra) => ({
      id: regra.id,
      area: regra.area,
      tipo: regra.tipo,
      gravidade: regra.gravidade,
      fontes: regra.fontes
    }))
  });
});

router.get('/', autenticarOpcional, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const contexto = {
    termo: req.query.termo,
    pratica: req.query.pratica || req.query.especialidade,
    produto: req.query.produto,
    condicoes: motor.normalizarEntrada(req.query.condicoes),
    medicamentos: motor.normalizarEntrada(req.query.medicamentos),
    alergias: motor.normalizarEntrada(req.query.alergias),
    observacoes: req.query.observacoes
  };

  const resultado = motor.verificar(contexto);
  registrarAuditoria(req, resultado, 'get');
  res.json({
    usuario_id: req.usuario?.id || null,
    ...resultado
  });
});

router.post('/verificar', autenticarOpcional, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const resultado = motor.verificar(req.body || {});
  registrarAuditoria(req, resultado, 'post');
  res.json({
    usuario_id: req.usuario?.id || null,
    verificado_em: new Date().toISOString(),
    ...resultado
  });
});

module.exports = router;
