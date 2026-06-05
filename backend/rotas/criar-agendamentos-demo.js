const express = require('express');
const router = express.Router();
const db = require('../database');

// Rota para criar agendamentos de demonstração (apenas em desenvolvimento)
router.post('/criar', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ erro: 'Disponível apenas em desenvolvimento' });
  }

  try {
    // Buscar IDs dos usuários demo
    const profissional = await db.query("SELECT id FROM usuarios WHERE email = 'joao@teste.com'");
    const paciente1 = await db.query("SELECT id FROM usuarios WHERE email = 'maria@teste.com'");
    const paciente2 = await db.query("SELECT id FROM usuarios WHERE email = 'pedro@teste.com'");

    if (profissional.rows.length === 0 || paciente1.rows.length === 0) {
      return res.status(400).json({ erro: 'Crie as contas demo primeiro (POST /api/criar-contas-demo/criar)' });
    }

    const profId = profissional.rows[0].id;
    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const agendamentos = [
      { paciente_id: paciente1.rows[0].id, profissional_id: profId, data: hoje, hora: '09:00', modalidade: 'online', valor: 150 },
      { paciente_id: paciente2.rows[0].id, profissional_id: profId, data: hoje, hora: '10:30', modalidade: 'presencial', valor: 200 },
      { paciente_id: paciente1.rows[0].id, profissional_id: profId, data: amanha, hora: '14:00', modalidade: 'online', valor: 150 }
    ];

    const criados = [];
    for (const a of agendamentos) {
      const [h, m] = a.hora.split(':').map(Number);
      const totalMin = h * 60 + m + 60;
      const fim = `${String(Math.floor(totalMin / 60)).padStart(2,'0')}:${String(totalMin % 60).padStart(2,'0')}`;

      const r = await db.query(
        'INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento, horario_inicio, horario_fim, modalidade, valor) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [a.paciente_id, a.profissional_id, a.data, a.hora, fim, a.modalidade, a.valor]
      );
      criados.push({ id: r.rows[0].id, data: a.data, hora: a.hora });
    }

    res.json({ mensagem: 'Agendamentos demo criados', agendamentos: criados });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao criar agendamentos demo', detalhe: e.message });
  }
});

module.exports = router;