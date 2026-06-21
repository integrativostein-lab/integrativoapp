const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const auditoria = require('../servicos/auditoria-lgpd');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// Banco terapêutico — acesso limitado por sessão (apenas profissional logado)
router.get('/banco-terapeutico', autenticar, async (req, res) => {
  const { especialidade_id, tipo, busca } = req.query;

  let q = 'SELECT bt.*, e.nome as especialidade_nome FROM banco_terapeutico bt JOIN especialidades e ON bt.especialidade_id = e.id WHERE bt.ativo = 1';
  const params = [];
  let i = 1;

  if (especialidade_id) { q += ` AND bt.especialidade_id = $${i}`; params.push(especialidade_id); i++; }
  if (tipo) { q += ` AND bt.tipo = $${i}`; params.push(tipo); i++; }
  if (busca) { q += ` AND bt.nome ILIKE $${i}`; params.push(`%${busca}%`); i++; }

  q += ' LIMIT 50';

  const r = await db.query(q, params);

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'consulta_banco_terapeutico',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'apoio clínico profissional com rastreabilidade de acesso',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'banco_terapeutico',
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: {
      especialidade_id: especialidade_id || null,
      tipo: tipo || null,
      busca: busca ? '[informado]' : null,
      total_retornado: r.rows.length
    }
  });

  const resultado = r.rows.map(item => ({
    ...item,
    _acessado_por: req.usuario.id,
    _acessado_em: new Date().toISOString()
  }));
  
  res.json(resultado);
});

// Banco terapêutico — criar item pessoal (apenas profissional logado)
router.post('/banco-terapeutico', autenticar, async (req, res) => {
  const { especialidade_id, tipo, nome, descricao, contraindicacoes, dosagem_padrao } = req.body;
  const r = await db.query(
    'INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, contraindicacoes, dosagem_padrao, criado_por) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [especialidade_id, tipo, nome, descricao, contraindicacoes, dosagem_padrao, req.usuario.id]
  );
  res.status(201).json({ mensagem: 'Item adicionado ao banco terapêutico!', id: r.rows[0].id });
});

// Banco terapêutico — editar (apenas itens que o próprio profissional criou)
router.put('/banco-terapeutico/:id', autenticar, async (req, res) => {
  const { nome, descricao, contraindicacoes, dosagem_padrao } = req.body;
  const item = await db.query('SELECT criado_por FROM banco_terapeutico WHERE id = $1', [req.params.id]);
  
  if (item.rows.length === 0) return res.status(404).json({ erro: 'Item não encontrado' });
  if (item.rows[0].criado_por !== req.usuario.id) return res.status(403).json({ erro: 'Você só pode editar itens que você mesmo criou' });
  
  await db.query('UPDATE banco_terapeutico SET nome=$1, descricao=$2, contraindicacoes=$3, dosagem_padrao=$4 WHERE id=$5 AND criado_por=$6',
    [nome, descricao, contraindicacoes, dosagem_padrao, req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Item atualizado!' });
});

// Banco terapêutico — excluir (apenas itens que o próprio profissional criou)
router.delete('/banco-terapeutico/:id', autenticar, async (req, res) => {
  const item = await db.query('SELECT criado_por FROM banco_terapeutico WHERE id = $1', [req.params.id]);
  
  if (item.rows.length === 0) return res.status(404).json({ erro: 'Item não encontrado' });
  if (item.rows[0].criado_por !== req.usuario.id) return res.status(403).json({ erro: 'Você só pode excluir itens que você mesmo criou' });
  
  await db.query('DELETE FROM banco_terapeutico WHERE id=$1 AND criado_por=$2', [req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Item removido!' });
});

// Prescrições
router.post('/', autenticar, async (req, res) => {
  const { paciente_id, itens, exames_sugeridos, observacoes, tipo_controlado } = req.body;
  const prof = await db.query('SELECT conselho_classe FROM usuarios WHERE id = $1', [req.usuario.id]);
  let tipo = 'solicitacao';
  if (prof.rows[0]?.conselho_classe) tipo = 'prescricao';
  if (tipo_controlado) tipo = 'controle_especial';

  const r = await db.query(
    'INSERT INTO prescricoes (paciente_id, profissional_id, tipo, itens, exames_sugeridos, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [paciente_id, req.usuario.id, tipo, JSON.stringify(itens), exames_sugeridos ? JSON.stringify(exames_sugeridos) : null, observacoes]
  );

  const resposta = { mensagem: `${tipo === 'prescricao' ? 'Prescrição' : tipo === 'controle_especial' ? 'Receita de Controle Especial' : 'Solicitação'} registrada!`, tipo, id: r.rows[0].id };

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'criacao_prescricao',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'registro de prescrição ou solicitação clínica',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'prescricao',
    recurso_id: r.rows[0].id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { paciente_id, tipo, controlado: Boolean(tipo_controlado) }
  });

  if (tipo === 'controle_especial') {
    resposta.vias = 2;
    resposta.validade = '30 dias';
    resposta.aviso = 'Receita de Controle Especial — 2 vias. Apresentar na farmácia.';
  }

  res.status(201).json(resposta);
});

router.get('/minhas', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM prescricoes WHERE paciente_id = $1 ORDER BY data_prescricao DESC', [req.usuario.id]);
  res.json(r.rows);
});

module.exports = router;