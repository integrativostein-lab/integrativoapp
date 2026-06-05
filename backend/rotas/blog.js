const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// Listar artigos públicos
router.get('/', async (req, res) => {
  const r = await db.query("SELECT a.*, u.nome as autor FROM artigos_blog a JOIN usuarios u ON a.usuario_id = u.id WHERE a.publicado = 1 ORDER BY a.criado_em DESC LIMIT 50");
  res.json(r.rows);
});

// Listar meus artigos
router.get('/meus', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM artigos_blog WHERE usuario_id = $1 ORDER BY criado_em DESC', [req.usuario.id]);
  res.json(r.rows);
});

// Buscar referências cruzadas para o blog
router.get('/referencias', autenticar, async (req, res) => {
  const { termo } = req.query;
  if (!termo) return res.json([]);

  // Buscar no banco terapêutico
  const bt = await db.query(
    "SELECT * FROM banco_terapeutico WHERE nome ILIKE $1 OR descricao ILIKE $1 LIMIT 5",
    ['%' + termo + '%']
  );

  // Buscar nos próprios artigos
  const artigos = await db.query(
    "SELECT id, titulo FROM artigos_blog WHERE usuario_id = $1 AND (titulo ILIKE $2 OR conteudo ILIKE $2) LIMIT 3",
    [req.usuario.id, '%' + termo + '%']
  );

  // Buscar interações medicamentosas (se for medicamento)
  let interacoes = [];
  if (termo.length > 3) {
    const inter = await db.query(
      "SELECT * FROM banco_terapeutico WHERE tipo = 'medicamento' AND (contraindicacoes ILIKE $1 OR descricao ILIKE $1) LIMIT 3",
      ['%' + termo + '%']
    );
    interacoes = inter.rows;
  }

  res.json({
    banco_terapeutico: bt.rows,
    seus_artigos: artigos.rows,
    interacoes: interacoes
  });
});

// Criar artigo (com validação de campos obrigatórios)
router.post('/', autenticar, async (req, res) => {
  const { titulo, conteudo, imagem_url, publicado, palavras_chave, meta_description, fonte_bibliografica } = req.body;

  if (!titulo || !conteudo) {
    return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
  }

  if (!fonte_bibliografica || fonte_bibliografica.length < 10) {
    return res.status(400).json({ erro: 'Fonte bibliográfica é obrigatória (mínimo 10 caracteres)' });
  }

  const r = await db.query(
    'INSERT INTO artigos_blog (usuario_id, titulo, conteudo, imagem_url, publicado, palavras_chave, meta_description, fonte_bibliografica) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [req.usuario.id, titulo, conteudo, imagem_url, publicado || 0, palavras_chave || '', meta_description || '', fonte_bibliografica]
  );
  res.status(201).json({ mensagem: 'Artigo criado!', id: r.rows[0].id });
});

// Atualizar artigo
router.put('/:id', autenticar, async (req, res) => {
  const { titulo, conteudo, imagem_url, publicado, palavras_chave, meta_description, fonte_bibliografica } = req.body;
  await db.query(
    'UPDATE artigos_blog SET titulo=$1, conteudo=$2, imagem_url=$3, publicado=$4, palavras_chave=$5, meta_description=$6, fonte_bibliografica=$7 WHERE id=$8 AND usuario_id=$9',
    [titulo, conteudo, imagem_url, publicado, palavras_chave, meta_description, fonte_bibliografica, req.params.id, req.usuario.id]
  );
  res.json({ mensagem: 'Artigo atualizado!' });
});

// Excluir artigo
router.delete('/:id', autenticar, async (req, res) => {
  await db.query('DELETE FROM artigos_blog WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Artigo removido!' });
});

module.exports = router;