const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/autenticar');
const auditoria = require('../servicos/auditoria-lgpd');
const { normalizarBibliotecas } = require('../utils/bibliotecas');
const { buscarConteudo, pesquisarGlobal } = require('../servicos/biblioteca-conteudo');
const db = require('../database');

function tiposProfissional() {
  return ['profissional', 'admin', 'super_admin'];
}

router.get('/conteudo', autenticar, async (req, res) => {
  if (!tiposProfissional().includes(req.usuario.tipo)) {
    return res.status(403).json({ erro: 'Acesso restrito a profissionais.' });
  }

  const biblioteca = String(req.query.biblioteca || req.query.nome || '').trim();
  if (!biblioteca) {
    return res.status(400).json({ erro: 'Informe o parâmetro biblioteca.' });
  }

  try {
    const dados = await buscarConteudo({
      nomeBiblioteca: biblioteca,
      busca: req.query.busca,
      tipo: req.query.tipo,
      limite: req.query.limite,
      offset: req.query.offset
    });

    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
      acao: 'consulta_biblioteca_conteudo',
      base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
      finalidade: 'consulta de protocolos e condutas terapêuticas',
      usuario_id: req.usuario.id,
      usuario_tipo: req.usuario.tipo,
      email: req.usuario.email,
      recurso: 'biblioteca_conteudo',
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip,
      detalhes: {
        biblioteca,
        busca: req.query.busca ? '[informado]' : null,
        total: dados.total
      }
    });

    res.json(dados);
  } catch (err) {
    console.error('Erro biblioteca conteudo:', err.message);
    res.status(500).json({ erro: 'Não foi possível carregar o conteúdo da biblioteca.' });
  }
});

router.get('/pesquisar', autenticar, async (req, res) => {
  if (!tiposProfissional().includes(req.usuario.tipo)) {
    return res.status(403).json({ erro: 'Acesso restrito a profissionais.' });
  }

  const termo = String(req.query.termo || req.query.busca || '').trim();
  if (!termo) {
    return res.status(400).json({ erro: 'Informe o termo de busca.' });
  }

  try {
    let bibliotecasPermitidas = null;
    const u = await db.query('SELECT especialidades FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (u.rows.length) {
      bibliotecasPermitidas = normalizarBibliotecas(u.rows[0].especialidades);
    }

    const dados = await pesquisarGlobal({ termo, bibliotecasPermitidas });
    res.json(dados);
  } catch (err) {
    console.error('Erro pesquisa bibliotecas:', err.message);
    res.status(500).json({ erro: 'Não foi possível pesquisar nas bibliotecas.' });
  }
});

module.exports = router;
