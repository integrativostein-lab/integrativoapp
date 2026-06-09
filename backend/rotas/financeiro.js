const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const { verificarRegistroABRATH } = require('../servicos/abrath');

// ============================================
// CONSTANTES DE NEGÓCIO
// ============================================
const VALORES_ANUAIS = {
  freemium: 0,
  pro: 899,
  premium: 4799,
  enterprise: 9990,
  coworking: 15990
};
const JUROS_MES = 0.0199;          // 1,99% a.m. — Tabela Price
const MAX_PARCELAS = 12;
const DESCONTO_PIX = 0.05;         // 5% à vista
const PRAZO_ARREPENDIMENTO_DIAS = 15;
const MULTA_APOS_PRAZO = 0.20;     // 20% sobre saldo proporcional

/**
 * Calcula parcelamento Tabela Price.
 * - PIX ou 1x => sem juros, com 5% off no PIX
 * - 2x..12x  => juros compostos de 1,99% a.m.
 */
function calcularParcelamento(valor, parcelas, formaPagamento) {
  let valorBase = valor;
  let descontoPix = 0;

  if (formaPagamento === 'pix') {
    descontoPix = valor * DESCONTO_PIX;
    valorBase = valor - descontoPix;
  }

  const n = Math.max(1, Math.min(MAX_PARCELAS, parseInt(parcelas, 10) || 1));
  if (n === 1 || formaPagamento === 'pix') {
    return {
      parcelas: n,
      valorParcela: parseFloat(valorBase.toFixed(2)),
      valorTotal: parseFloat(valorBase.toFixed(2)),
      juros: 0,
      desconto_pix: parseFloat(descontoPix.toFixed(2))
    };
  }

  const i = JUROS_MES;
  const fator = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const valorParcela = valorBase * fator;
  const valorTotal = valorParcela * n;

  return {
    parcelas: n,
    valorParcela: parseFloat(valorParcela.toFixed(2)),
    valorTotal: parseFloat(valorTotal.toFixed(2)),
    juros: parseFloat((valorTotal - valorBase).toFixed(2)),
    desconto_pix: 0
  };
}

// ============================================
// SIMULAÇÃO DE PARCELAMENTO (público / pré-checkout)
// ============================================
router.post('/simular-parcelamento', (req, res) => {
  const { plano, parcelas, forma_pagamento } = req.body || {};
  const valorBase = VALORES_ANUAIS[plano];
  if (valorBase == null) return res.status(400).json({ erro: 'Plano inválido' });
  if (valorBase === 0) return res.json({ plano, parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 });
  res.json({ plano, ...calcularParcelamento(valorBase, parcelas, forma_pagamento) });
});

// ============================================
// PAGAMENTO DE CONSULTA (server-side recalcula valor)
// ============================================
router.post('/pagar', autenticar, async (req, res) => {
  try {
    const { agendamento_id, forma_pagamento, parcelas } = req.body || {};
    if (!agendamento_id) return res.status(400).json({ erro: 'agendamento_id é obrigatório' });

    // Fonte de verdade do valor é o agendamento, NÃO o body
    const ag = await db.query('SELECT valor FROM agendamentos WHERE id = $1 AND paciente_id = $2', [agendamento_id, req.usuario.id]);
    if (ag.rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const valorBase = parseFloat(ag.rows[0].valor);
    const calc = calcularParcelamento(valorBase, parcelas || 1, forma_pagamento);

    const r = await db.query(
      `INSERT INTO pagamentos (usuario_id, agendamento_id, tipo, valor, forma_pagamento, parcelas, status)
       VALUES ($1, $2, 'consulta', $3, $4, $5, 'pendente') RETURNING id`,
      [req.usuario.id, agendamento_id, calc.valorTotal, forma_pagamento, calc.parcelas]
    );

    res.json({
      mensagem: 'Pagamento registrado como pendente. Aguardando confirmação do gateway.',
      id: r.rows[0].id,
      valor_original: valorBase,
      ...calc
    });
  } catch (e) {
    console.error('[financeiro/pagar]', e.message);
    res.status(500).json({ erro: 'Erro ao registrar pagamento' });
  }
});

// ============================================
// LISTAR PAGAMENTOS DO USUÁRIO
// ============================================
router.get('/meus-pagamentos', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM pagamentos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50', [req.usuario.id]);
  res.json(r.rows);
});

// ============================================
// EMITIR NOTA FISCAL (apenas dono do pagamento)
// ============================================
router.post('/nota-fiscal', autenticar, async (req, res) => {
  try {
    const { pagamento_id, autorizar } = req.body || {};
    const pag = await db.query('SELECT * FROM pagamentos WHERE id = $1 AND usuario_id = $2', [pagamento_id, req.usuario.id]);
    if (pag.rows.length === 0) return res.status(404).json({ erro: 'Pagamento não encontrado' });

    if (pag.rows[0].tipo === 'produto') {
      const nf = await db.query(
        "INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status) VALUES ($1, $2, 'nfse', $3, 'emitida') RETURNING id",
        [req.usuario.id, pagamento_id, pag.rows[0].valor]
      );
      return res.json({ mensagem: 'NF automática emitida!', id: nf.rows[0].id });
    }

    if (!autorizar) return res.json({ mensagem: 'Aguardando autorização', precisa_autorizacao: true });

    const nf = await db.query(
      "INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status, autorizada_por, data_autorizacao) VALUES ($1, $2, 'nfse', $3, 'emitida', $4, NOW()) RETURNING id",
      [req.usuario.id, pagamento_id, pag.rows[0].valor, req.usuario.id]
    );
    res.json({ mensagem: 'NF emitida!', id: nf.rows[0].id });
  } catch (e) {
    console.error('[financeiro/nota-fiscal]', e.message);
    res.status(500).json({ erro: 'Erro ao emitir nota fiscal' });
  }
});

// ============================================
// ASSINATURA — APENAS ANUAL (ou Freemium)
// ============================================
router.post('/renovar-assinatura', autenticar, async (req, res) => {
  try {
    const { plano, forma_pagamento, parcelas, codigo_cupom, abrath_registro, abrath_nome } = req.body || {};
    if (VALORES_ANUAIS[plano] == null) {
      return res.status(400).json({ erro: 'Plano inválido' });
    }
    if (plano === 'freemium') {
      await db.query("UPDATE usuarios SET plano = 'freemium', assinatura_ativa = 0 WHERE id = $1", [req.usuario.id]);
      return res.json({ mensagem: 'Plano Freemium ativado.', plano, valor: 0 });
    }

    const valorBase = VALORES_ANUAIS[plano];
    let valor = valorBase;
    let vitalicio = false;
    let descontoAplicado = 0;

    // Cupom vitalício especial (single-use)
    if (codigo_cupom && codigo_cupom.toUpperCase() === 'PRESENTEDOMAU' && plano === 'premium') {
      const cup = await db.query("SELECT valor FROM configuracoes WHERE chave = 'cupom_presentedomau_usado'").catch(() => ({ rows: [] }));
      if (cup.rows.length === 0 || cup.rows[0].valor !== 'true') {
        vitalicio = true;
        valor = 0;
        descontoAplicado = 100;
        await db.query(
          "INSERT INTO configuracoes (chave, valor) VALUES ('cupom_presentedomau_usado', 'true') ON CONFLICT (chave) DO UPDATE SET valor = 'true'"
        ).catch(() => {});
      }
    }

    // Desconto ABRATH 15% — não acumula com cupom, não vale Coworking
    if (!vitalicio && abrath_registro && abrath_nome && plano !== 'coworking') {
      const verificado = await verificarRegistroABRATH(abrath_registro, abrath_nome);
      if (verificado) {
        descontoAplicado = Math.max(descontoAplicado, 15);
        valor = valorBase * 0.85;
      }
    }

    const calc = vitalicio
      ? { parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 }
      : calcularParcelamento(valor, parcelas || 1, forma_pagamento);

    const dataExpiracao = new Date();
    if (vitalicio) dataExpiracao.setFullYear(2099);
    else dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

    const r = await db.query(
      `INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, parcelas, renovacao_automatica, status)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, 0, 'ativa') RETURNING id`,
      [req.usuario.id, plano, vitalicio ? 'vitalicio' : 'anual', calc.valorTotal,
        dataExpiracao.toISOString().split('T')[0], calc.parcelas]
    );

    await db.query(
      "UPDATE usuarios SET plano = $1, assinatura_ativa = 1, data_expiracao_assinatura = $2 WHERE id = $3",
      [plano, dataExpiracao.toISOString().split('T')[0], req.usuario.id]
    );

    res.json({
      mensagem: vitalicio ? '🎉 Assinatura Premium Vitalícia ativada!' : 'Assinatura anual ativada!',
      vitalicio,
      plano,
      tipo_ciclo: vitalicio ? 'vitalicio' : 'anual',
      valor_base: valorBase,
      desconto_pct: descontoAplicado,
      ...calc,
      id: r.rows[0].id
    });
  } catch (e) {
    console.error('[financeiro/renovar-assinatura]', e.message);
    res.status(500).json({ erro: 'Erro ao processar assinatura' });
  }
});

// ============================================
// CANCELAR ASSINATURA — janela de arrependimento de 15 dias
// ============================================
router.post('/cancelar-assinatura', autenticar, async (req, res) => {
  try {
    const { assinatura_id } = req.body || {};
    const a = await db.query('SELECT * FROM assinaturas WHERE id = $1 AND usuario_id = $2', [assinatura_id, req.usuario.id]);
    if (a.rows.length === 0) return res.status(404).json({ erro: 'Assinatura não encontrada' });

    const ass = a.rows[0];
    if (ass.status !== 'ativa') return res.status(400).json({ erro: 'Assinatura não está ativa' });

    const hoje = new Date();
    const inicio = new Date(ass.data_inicio);
    const diasUsados = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));

    let multa = 0;
    let valorEstorno = 0;
    let mensagem = '';

    if (diasUsados <= PRAZO_ARREPENDIMENTO_DIAS) {
      valorEstorno = parseFloat(ass.valor);
      mensagem = `Cancelamento dentro do prazo de ${PRAZO_ARREPENDIMENTO_DIAS} dias — reembolso integral aprovado.`;
    } else if (ass.tipo_ciclo === 'anual') {
      const totalDias = 365;
      const diasRestantes = Math.max(0, totalDias - diasUsados);
      const valorPorDia = parseFloat(ass.valor) / totalDias;
      const valorRestante = valorPorDia * diasRestantes;
      multa = valorRestante * MULTA_APOS_PRAZO;
      valorEstorno = Math.max(0, valorRestante - multa);
      mensagem = `Cancelamento após ${PRAZO_ARREPENDIMENTO_DIAS} dias — multa de 20% aplicada sobre o saldo proporcional.`;
    } else {
      mensagem = 'Assinatura cancelada.';
    }

    await db.query("UPDATE assinaturas SET status = 'cancelada', data_cancelamento = NOW() WHERE id = $1", [assinatura_id]);
    await db.query("UPDATE usuarios SET assinatura_ativa = 0, plano = 'freemium' WHERE id = $1", [req.usuario.id]);

    res.json({
      mensagem,
      dias_usados: diasUsados,
      dentro_do_prazo: diasUsados <= PRAZO_ARREPENDIMENTO_DIAS,
      multa: parseFloat(multa.toFixed(2)),
      valor_estorno: parseFloat(valorEstorno.toFixed(2))
    });
  } catch (e) {
    console.error('[financeiro/cancelar-assinatura]', e.message);
    res.status(500).json({ erro: 'Erro ao cancelar assinatura' });
  }
});

// ============================================
// DASHBOARD FINANCEIRO
// ============================================
router.get('/dashboard', autenticar, async (req, res) => {
  try {
    const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
    const ass = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE status = 'ativa'");
    res.json({ faturamento: fat.rows[0].t, assinaturas_ativas: ass.rows[0].t });
  } catch (e) {
    console.error('[financeiro/dashboard]', e.message);
    res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
