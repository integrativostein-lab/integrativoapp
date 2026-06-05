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

// Rota para atualizar a logo e cores dos formulários
router.put('/personalizar', autenticar, async (req, res) => {
  try {
    // Verifica se o plano é Enterprise
    const user = await db.query('SELECT plano FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (user.rows[0].plano !== 'enterprise') {
      return res.status(403).json({ erro: 'Funcionalidade exclusiva para planos Enterprise' });
    }

    const { logo_url, cor_primaria, cor_fundo, nome_clinica } = req.body;
    const config = JSON.stringify({ logo_url, cor_primaria, cor_fundo, nome_clinica });
    
    await db.query(
      "INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ('formularios_config', $1, $2) ON CONFLICT (chave, usuario_id) DO UPDATE SET valor = $1",
      [config, req.usuario.id]
    );

    res.json({ mensagem: 'Formulários personalizados com sucesso!' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao personalizar formulários' });
  }
});

// Rota para obter a configuração atual
router.get('/config', autenticar, async (req, res) => {
  try {
    const r = await db.query("SELECT valor FROM configuracoes WHERE chave = 'formularios_config' AND usuario_id = $1", [req.usuario.id]);
    if (r.rows.length > 0) {
      res.json(JSON.parse(r.rows[0].valor));
    } else {
      res.json({ logo_url: null, cor_primaria: '#1A365D', cor_fundo: '#FFFFFF', nome_clinica: '' });
    }
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar configuração' });
  }
});

module.exports = router;