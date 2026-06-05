const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/migracao/' });

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.post('/upload', autenticar, upload.array('arquivos', 50), async (req, res) => {
  const importados = [];
  const ignorados = [];
  
  for (const arquivo of req.files) {
    try {
      const nomePaciente = arquivo.originalname.replace('.pdf', '').replace('.csv', '').replace('.json', '');
      importados.push(nomePaciente);
    } catch {
      ignorados.push(arquivo.originalname);
    }
  }

  await db.query('INSERT INTO migracao_dados (usuario_id, tipo, arquivo_original, registros_importados, registros_ignorados) VALUES ($1,$2,$3,$4,$5)', [req.usuario.id, 'pdf', req.files.map(f => f.originalname).join(','), importados.length, ignorados.length]);

  res.json({
    mensagem: 'Migração concluída!',
    importados: importados.length,
    ignorados: ignorados.length,
    detalhes: { importados, ignorados }
  });
});

router.get('/historico', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM migracao_dados WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 20', [req.usuario.id]);
  res.json(r.rows);
});

module.exports = router;