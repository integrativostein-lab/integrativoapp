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

// Gerar arquivo BPA (Boletim de Produção Ambulatorial)
router.get('/bpa', autenticar, async (req, res) => {
  try {
    const { mes, ano } = req.query;
    if (!mes || !ano) return res.status(400).json({ erro: 'Informe mês e ano (ex: ?mes=06&ano=2026)' });

    // Buscar dados do profissional
    const prof = await db.query('SELECT cnes, cns_profissional, cbo FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (prof.rows.length === 0 || !prof.rows[0].cnes) {
      return res.status(400).json({ erro: 'CNES não cadastrado. Cadastre seu CNES em Configurações → Perfil.' });
    }

    const cnes = prof.rows[0].cnes;
    const cnsProf = prof.rows[0].cns_profissional || '000000000000000';
    const cbo = prof.rows[0].cbo || '225142'; // CBO padrão: Terapeuta Ocupacional

    // Buscar agendamentos realizados no período
    const inicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const fim = `${ano}-${mes}-${ultimoDia}`;

    const agendamentos = await db.query(
      `SELECT a.*, u.cns as paciente_cns, u.nome as paciente_nome 
       FROM agendamentos a 
       JOIN usuarios u ON a.paciente_id = u.id 
       WHERE a.profissional_id = $1 
         AND a.data_agendamento BETWEEN $2 AND $3 
         AND a.status = 'realizado'
       ORDER BY a.data_agendamento`,
      [req.usuario.id, inicio, fim]
    );

    if (agendamentos.rows.length === 0) {
      return res.status(404).json({ erro: 'Nenhum atendimento realizado neste período.' });
    }

    // Gerar arquivo BPA
    let bpa = '';
    const lote = `${ano}${mes}`;
    
    for (const a of agendamentos.rows) {
      const data = a.data_agendamento.replace(/-/g, '');
      const pacienteCNS = a.paciente_cns || '000000000000000';
      const procedimento = '0301010023'; // Código SIGTAP para consulta
      const quantidade = '001';
      
      // Linha BPA (formato DATASUS)
      bpa += `${cnes}${data}${cbo}${procedimento}${pacienteCNS}${quantidade}\n`;
    }

    // Enviar arquivo
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=BPA_${lote}_${cnes}.txt`);
    res.send(bpa);

    console.log(`📋 BPA gerado: ${agendamentos.rows.length} atendimentos — ${mes}/${ano}`);
  } catch (e) {
    console.error('Erro ao gerar BPA:', e);
    res.status(500).json({ erro: 'Erro ao gerar relatório SUS' });
  }
});

module.exports = router;