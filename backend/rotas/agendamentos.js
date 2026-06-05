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

router.post('/', autenticar, async (req, res) => {
  const { profissional_id, data_agendamento, horario_inicio, modalidade, tipo_sessao } = req.body;
  const v = await db.query('SELECT valor_online, valor_presencial, valor_domicilio, duracao_minutos FROM profissional_valores WHERE usuario_id = $1 LIMIT 1', [profissional_id]);
  if (v.rows.length === 0) return res.status(400).json({ erro: 'Profissional sem valores' });
  
  const valor = modalidade === 'online' ? v.rows[0].valor_online : (modalidade === 'domicilio' ? v.rows[0].valor_domicilio : v.rows[0].valor_presencial);
  const duracao = v.rows[0].duracao_minutos || 60;
  const [h, m] = horario_inicio.split(':').map(Number);
  const totalMin = h * 60 + m + duracao;
  const fim = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;

  const r = await db.query(
    'INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento, horario_inicio, horario_fim, modalidade, valor, tipo_sessao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [req.usuario.id, profissional_id, data_agendamento, horario_inicio, fim, modalidade, valor, tipo_sessao || 'consulta']
  );
  res.status(201).json({ mensagem: 'Agendado!', id: r.rows[0].id });
});

router.get('/meus', autenticar, async (req, res) => {
  const q = req.usuario.tipo === 'paciente' ? 'a.paciente_id = $1' : 'a.profissional_id = $1';
  const r = await db.query(`SELECT a.*, u.nome as profissional_nome FROM agendamentos a JOIN usuarios u ON a.profissional_id = u.id WHERE ${q} ORDER BY a.data_agendamento DESC LIMIT 50`, [req.usuario.id]);
  res.json(r.rows);
});

router.put('/:id/cancelar', autenticar, async (req, res) => {
  try {
    const agendamento = await db.query('SELECT * FROM agendamentos WHERE id = $1 AND paciente_id = $2', [req.params.id, req.usuario.id]);
    if (agendamento.rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const ag = agendamento.rows[0];
    const regras = await db.query('SELECT * FROM profissional_regras_agendamento WHERE usuario_id = $1', [ag.profissional_id]);
    
    if (regras.rows.length > 0) {
      const r = regras.rows[0];
      const agora = new Date();
      const dataHoraAgendamento = new Date(`${ag.data_agendamento}T${ag.horario_inicio}`);
      const diffHoras = (dataHoraAgendamento - agora) / (1000 * 60 * 60);
      
      let multa = 0;
      let mensagem = 'Agendamento cancelado!';
      
      if (diffHoras < r.prazo_cancelamento_horas && r.multa_falta_valor > 0) {
        multa = r.multa_falta_valor;
        mensagem = `Agendamento cancelado. Multa de R$ ${multa.toFixed(2)} aplicada conforme regras do profissional.`;
        await db.query("INSERT INTO pagamentos (usuario_id, agendamento_id, tipo, valor, forma_pagamento, status) VALUES ($1, $2, 'multa_cancelamento', $3, 'pendente', 'pendente')", [req.usuario.id, req.params.id, multa]);
      }
      
      await db.query("UPDATE agendamentos SET status = 'cancelado', data_cancelamento = NOW(), cancelado_por = 'paciente' WHERE id = $1", [req.params.id]);
      return res.json({ mensagem, multa });
    }
    
    await db.query("UPDATE agendamentos SET status = 'cancelado', data_cancelamento = NOW(), cancelado_por = 'paciente' WHERE id = $1", [req.params.id]);
    res.json({ mensagem: 'Agendamento cancelado!', multa: 0 });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cancelar agendamento' });
  }
});

router.put('/:id/remarcar', autenticar, async (req, res) => {
  try {
    const { data_agendamento, horario_inicio } = req.body;
    if (!data_agendamento || !horario_inicio) return res.status(400).json({ erro: 'Data e horário obrigatórios' });
    
    const agendamento = await db.query('SELECT * FROM agendamentos WHERE id = $1 AND paciente_id = $2', [req.params.id, req.usuario.id]);
    if (agendamento.rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const ag = agendamento.rows[0];
    const regras = await db.query('SELECT * FROM profissional_regras_agendamento WHERE usuario_id = $1', [ag.profissional_id]);
    
    let multa = 0;
    let mensagem = 'Agendamento remarcado!';
    
    if (regras.rows.length > 0) {
      const r = regras.rows[0];
      const agora = new Date();
      const dataHoraAgendamento = new Date(`${ag.data_agendamento}T${ag.horario_inicio}`);
      const diffHoras = (dataHoraAgendamento - agora) / (1000 * 60 * 60);
      
      const mesAtual = new Date().toISOString().substring(0, 7);
      const reagendamentosMes = await db.query("SELECT COUNT(*) as total FROM agendamentos WHERE paciente_id = $1 AND status = 'reagendado' AND data_cancelamento LIKE $2", [req.usuario.id, mesAtual + '%']);
      
      if (reagendamentosMes.rows[0].total >= r.limite_reagendamentos_mes) {
        return res.status(400).json({ erro: `Limite de ${r.limite_reagendamentos_mes} reagendamentos por mês atingido.` });
      }
      
      if (diffHoras < r.prazo_cancelamento_horas && r.multa_falta_valor > 0) {
        multa = r.multa_falta_valor;
        mensagem = `Agendamento remarcado. Multa de R$ ${multa.toFixed(2)} aplicada conforme regras do profissional.`;
        await db.query("INSERT INTO pagamentos (usuario_id, agendamento_id, tipo, valor, forma_pagamento, status) VALUES ($1, $2, 'multa_reagendamento', $3, 'pendente', 'pendente')", [req.usuario.id, req.params.id, multa]);
      }
    }

    await db.query("UPDATE agendamentos SET data_agendamento = $1, horario_inicio = $2, status = 'reagendado', data_cancelamento = NOW() WHERE id = $3 AND paciente_id = $4", [data_agendamento, horario_inicio, req.params.id, req.usuario.id]);
    res.json({ mensagem, multa });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao remarcar agendamento' });
  }
});

router.post('/retorno', autenticar, async (req, res) => {
  try {
    const { paciente_id, data_limite, consulta_original_id } = req.body;
    const consulta = await db.query('SELECT * FROM agendamentos WHERE id = $1 AND profissional_id = $2', [consulta_original_id, req.usuario.id]);
    if (consulta.rows.length === 0) return res.status(404).json({ erro: 'Consulta original não encontrada' });

    const r = await db.query(
      'INSERT INTO retornos (paciente_id, profissional_id, consulta_original_id, data_limite, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [paciente_id, req.usuario.id, consulta_original_id, data_limite, 'pendente']
    );
    res.status(201).json({ mensagem: 'Retorno agendado! O paciente será notificado.', id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao agendar retorno' });
  }
});

router.put('/retorno/:id', autenticar, async (req, res) => {
  try {
    const { data_limite } = req.body;
    const retorno = await db.query('SELECT * FROM retornos WHERE id = $1 AND profissional_id = $2', [req.params.id, req.usuario.id]);
    if (retorno.rows.length === 0) return res.status(404).json({ erro: 'Retorno não encontrado' });

    await db.query('UPDATE retornos SET data_limite = $1 WHERE id = $2', [data_limite, req.params.id]);
    res.json({ mensagem: 'Prazo do retorno atualizado!' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao editar retorno' });
  }
});

module.exports = router;
