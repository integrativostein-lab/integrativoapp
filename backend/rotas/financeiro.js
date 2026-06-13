const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const { verificarRegistroABRATH } = require('../servicos/abrath');
const { estornarPagamento } = require('../config/stripe');
const notificacoes = require('../servicos/notificacoes');

// ============================================
// CONSTANTES DE NEGÓCIO
// ============================================
const VALORES_ANUAIS = {
  freemium: 0,
  guardioes_floresta: 200,
  pro: 899,
  premium: 4799,
  enterprise: 9990
};
const JUROS_MES = 0.0199;          // 1,99% a.m. — Tabela Price
const MAX_PARCELAS = 12;
const DESCONTO_PIX = 0.05;         // 5% à vista
const DESCONTO_ABRATH = 0.08;      // 8% sobre assinaturas Pro e Premium
const PLANOS_COM_DESCONTO_ABRATH = ['pro', 'premium'];
const PRAZO_ARREPENDIMENTO_DIAS = 15;
const MULTA_APOS_PRAZO = 0.20;     // 20% sobre saldo proporcional
const VALOR_CERTIFICADO_A1 = 260.00;
const PLANOS_COM_CERTIFICADO_A1 = ['premium', 'enterprise'];

async function garantirColunasAssinaturaPagamento() {
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(30)").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway_id VARCHAR(255)").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway_resposta JSONB").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS valor_estornado DECIMAL(10, 2) DEFAULT 0").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS estorno_gateway_id VARCHAR(255)").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS estorno_status VARCHAR(40)").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS estorno_resposta JSONB").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS certificado_a1_emitido_plataforma BOOLEAN DEFAULT false").catch(() => {});
  await db.query("ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS cancelamento_recibo JSONB").catch(() => {});
}

async function garantirColunasCartaoUsuario() {
  await db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cartao_final4 VARCHAR(4)").catch(() => {});
  await db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cartao_obrigatorio_confirmado BOOLEAN DEFAULT false").catch(() => {});
  await db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cartao_atualizado_em TIMESTAMP").catch(() => {});
}

async function garantirTabelaValidacaoAssinatura() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS assinatura_validacoes (
      id SERIAL PRIMARY KEY,
      assinatura_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      codigo_hash VARCHAR(80) NOT NULL,
      expira_em TIMESTAMP NOT NULL,
      validado_em TIMESTAMP,
      tentativas INTEGER DEFAULT 0,
      canais_enviados JSONB,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_assinatura_validacoes_assinatura
    ON assinatura_validacoes (assinatura_id, criado_em DESC)
  `);
}

function hashCodigo(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

function gerarCodigoValidacao() {
  return String(crypto.randomInt(100000, 1000000));
}

async function buscarUsuarioContato(usuarioId) {
  const r = await db.query('SELECT id, nome, email, telefone FROM usuarios WHERE id = $1', [usuarioId]);
  return r.rows[0] || {};
}

async function criarValidacaoAssinatura({ assinaturaId, usuario }) {
  await garantirTabelaValidacaoAssinatura();
  const codigo = gerarCodigoValidacao();
  const canais = await notificacoes.enviarCodigoAssinatura({ usuario, codigo });
  await db.query(
    `INSERT INTO assinatura_validacoes (assinatura_id, usuario_id, codigo_hash, expira_em, canais_enviados)
     VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes', $4)`,
    [assinaturaId, usuario.id, hashCodigo(codigo), JSON.stringify(canais)]
  );
  return canais;
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function montarReciboCancelamento({ ass, diasUsados, mesesUsados, mesesRestantes, valorMensalEquivalente, valorRestante, multa, certificadoCobrado, valorEstorno, estornoGateway }) {
  const linhas = [
    ['Plano', ass.plano],
    ['Valor pago no ciclo anual', moeda(ass.valor)],
    ['Data de início', new Date(ass.data_inicio).toLocaleDateString('pt-BR')],
    ['Tempo utilizado', `${diasUsados} dia(s), equivalente a ${mesesUsados} mês(es) para cálculo proporcional`],
    ['Meses restantes no ciclo anual', `${mesesRestantes} mês(es)`],
    ['Valor mensal equivalente', moeda(valorMensalEquivalente)],
    ['Saldo proporcional restante', moeda(valorRestante)],
    ['Retenção/multa de 20% sobre o saldo restante', moeda(multa)],
    ['Certificado A1 emitido pela plataforma', certificadoCobrado > 0 ? moeda(certificadoCobrado) : 'Não cobrado'],
    ['Valor final de reembolso', moeda(valorEstorno)],
    ['Status do estorno', estornoGateway?.status || 'não solicitado']
  ];

  return {
    texto: linhas.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<table border="1" cellpadding="8" cellspacing="0">${linhas.map(([k, v]) => `<tr><th align="left">${k}</th><td>${v}</td></tr>`).join('')}</table>`
  };
}

/**
 * Calcula parcelamento Tabela Price.
 * - PIX ou 1x => sem juros, com 5% off no PIX
 * - 2x..12x  => juros compostos de 1,99% a.m.
 */
function calcularParcelamento(valor, parcelas, formaPagamento, aplicarDescontoPix = true) {
  let valorBase = valor;
  let descontoPix = 0;

  if (formaPagamento === 'pix' && aplicarDescontoPix) {
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
  res.json({ plano, ...calcularParcelamento(valorBase, parcelas, forma_pagamento, plano !== 'guardioes_floresta') });
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
    await garantirColunasAssinaturaPagamento();
    await garantirColunasCartaoUsuario();
    await garantirTabelaValidacaoAssinatura();
    const { plano, forma_pagamento, parcelas, codigo_cupom, abrath_registro, abrath_nome, gateway_id, cartao_final4, cartao_obrigatorio_confirmado } = req.body || {};
    if (VALORES_ANUAIS[plano] == null) {
      return res.status(400).json({ erro: 'Plano inválido' });
    }
    if (!cartao_obrigatorio_confirmado || !cartao_final4) {
      return res.status(400).json({ erro: 'Cartão de crédito obrigatório para cobrança automática de teleconsultas.' });
    }
    await db.query(
      'UPDATE usuarios SET cartao_final4 = $1, cartao_obrigatorio_confirmado = true, cartao_atualizado_em = NOW() WHERE id = $2',
      [String(cartao_final4).slice(-4), req.usuario.id]
    ).catch(() => {});

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

    // Desconto ABRATH 8% — vale para Pro e Premium, independente da forma de pagamento.
    if (!vitalicio && abrath_registro && abrath_nome && PLANOS_COM_DESCONTO_ABRATH.includes(plano)) {
      const verificado = await verificarRegistroABRATH(abrath_registro, abrath_nome);
      if (verificado) {
        descontoAplicado = Math.max(descontoAplicado, DESCONTO_ABRATH * 100);
        valor = valorBase * (1 - DESCONTO_ABRATH);
      }
    }

    const calc = plano === 'freemium'
      ? { parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 }
      : vitalicio
      ? { parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 }
      : calcularParcelamento(valor, parcelas || 1, forma_pagamento, plano !== 'guardioes_floresta');

    const dataExpiracao = new Date();
    if (vitalicio) dataExpiracao.setFullYear(2099);
    else dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

    const gatewayResposta = {
      cartao_final4: cartao_final4 || null,
      cartao_obrigatorio_confirmado: !!cartao_obrigatorio_confirmado,
      observacao: gateway_id ? 'Pagamento vinculado ao gateway.' : 'Pagamento registrado sem identificador de gateway; estorno automático depende da administradora configurada.'
    };

    const r = await db.query(
      `INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, parcelas, renovacao_automatica, status, forma_pagamento, gateway_id, gateway_resposta)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, 0, 'pendente_validacao', $7, $8, $9) RETURNING id`,
      [req.usuario.id, plano, vitalicio ? 'vitalicio' : 'anual', calc.valorTotal,
        dataExpiracao.toISOString().split('T')[0], calc.parcelas, forma_pagamento || null, gateway_id || null, JSON.stringify(gatewayResposta)]
    );

    const usuario = await buscarUsuarioContato(req.usuario.id);
    const canais = await criarValidacaoAssinatura({ assinaturaId: r.rows[0].id, usuario });

    res.json({
      mensagem: 'Enviamos um código de validação por WhatsApp e email. Digite o código para ativar sua assinatura.',
      precisa_validacao: true,
      vitalicio,
      plano,
      tipo_ciclo: vitalicio ? 'vitalicio' : 'anual',
      valor_base: valorBase,
      desconto_pct: descontoAplicado,
      ...calc,
      id: r.rows[0].id,
      canais
    });
  } catch (e) {
    console.error('[financeiro/renovar-assinatura]', e.message);
    res.status(500).json({ erro: 'Erro ao processar assinatura' });
  }
});

router.post('/validar-assinatura-codigo', autenticar, async (req, res) => {
  try {
    await garantirTabelaValidacaoAssinatura();
    const { assinatura_id, codigo } = req.body || {};
    if (!assinatura_id || !codigo) return res.status(400).json({ erro: 'Assinatura e código são obrigatórios' });

    const a = await db.query('SELECT * FROM assinaturas WHERE id = $1 AND usuario_id = $2', [assinatura_id, req.usuario.id]);
    if (a.rows.length === 0) return res.status(404).json({ erro: 'Assinatura não encontrada' });
    const ass = a.rows[0];
    if (ass.status !== 'pendente_validacao') {
      return res.status(400).json({ erro: 'Assinatura não está pendente de validação' });
    }

    const v = await db.query(
      `SELECT * FROM assinatura_validacoes
       WHERE assinatura_id = $1 AND usuario_id = $2 AND validado_em IS NULL
       ORDER BY criado_em DESC LIMIT 1`,
      [assinatura_id, req.usuario.id]
    );
    if (v.rows.length === 0) return res.status(400).json({ erro: 'Código não encontrado ou já utilizado' });
    const validacao = v.rows[0];
    if (new Date(validacao.expira_em) < new Date()) return res.status(400).json({ erro: 'Código expirado. Solicite uma nova assinatura para receber outro código.' });
    if ((validacao.tentativas || 0) >= 5) return res.status(429).json({ erro: 'Muitas tentativas. Solicite um novo código.' });

    if (validacao.codigo_hash !== hashCodigo(codigo)) {
      await db.query('UPDATE assinatura_validacoes SET tentativas = tentativas + 1 WHERE id = $1', [validacao.id]);
      return res.status(400).json({ erro: 'Código inválido' });
    }

    await db.query('UPDATE assinatura_validacoes SET validado_em = NOW() WHERE id = $1', [validacao.id]);
    await db.query("UPDATE assinaturas SET status = 'ativa' WHERE id = $1", [assinatura_id]);

    const assinaturaAtiva = ass.plano !== 'freemium' ? 1 : 0;
    await db.query(
      'UPDATE usuarios SET plano = $1, assinatura_ativa = $2, data_expiracao_assinatura = $3 WHERE id = $4',
      [ass.plano, assinaturaAtiva, ass.data_expiracao, req.usuario.id]
    );

    const usuario = await buscarUsuarioContato(req.usuario.id);
    await notificacoes.enviarBoasVindasAssinatura({ usuario });

    res.json({
      mensagem: 'Assinatura validada. Seja bem-vindo(a) ao Integrativo.App!',
      plano: ass.plano,
      assinatura_ativa: !!assinaturaAtiva
    });
  } catch (e) {
    console.error('[financeiro/validar-assinatura-codigo]', e.message);
    res.status(500).json({ erro: 'Erro ao validar assinatura' });
  }
});

// ============================================
// CANCELAR ASSINATURA — janela de arrependimento de 15 dias
// ============================================
router.post('/cancelar-assinatura', autenticar, async (req, res) => {
  try {
    await garantirColunasAssinaturaPagamento();
    const { assinatura_id } = req.body || {};
    const a = await db.query('SELECT * FROM assinaturas WHERE id = $1 AND usuario_id = $2', [assinatura_id, req.usuario.id]);
    if (a.rows.length === 0) return res.status(404).json({ erro: 'Assinatura não encontrada' });

    const ass = a.rows[0];
    if (ass.status !== 'ativa') return res.status(400).json({ erro: 'Assinatura não está ativa' });

    const hoje = new Date();
    const inicio = new Date(ass.data_inicio);
    const diasUsados = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
    const mesesUsados = Math.min(12, Math.max(1, Math.ceil(diasUsados / 30)));
    const mesesRestantes = Math.max(0, 12 - mesesUsados);
    const valorAssinatura = parseFloat(ass.valor) || 0;
    const valorMensalEquivalente = valorAssinatura / 12;
    const valorRestante = valorMensalEquivalente * mesesRestantes;

    let multa = 0;
    let valorEstorno = 0;
    let certificadoCobrado = 0;
    let mensagem = '';

    if (diasUsados <= PRAZO_ARREPENDIMENTO_DIAS) {
      valorEstorno = valorAssinatura;
      mensagem = `Cancelamento dentro do prazo de ${PRAZO_ARREPENDIMENTO_DIAS} dias — reembolso calculado conforme regras de cancelamento.`;
    } else if (ass.tipo_ciclo === 'anual') {
      multa = valorRestante * MULTA_APOS_PRAZO;
      valorEstorno = Math.max(0, valorRestante - multa);
      mensagem = `Cancelamento após ${PRAZO_ARREPENDIMENTO_DIAS} dias — retenção de 20% aplicada sobre o saldo dos ${mesesRestantes} mês(es) restante(s) do ciclo anual.`;
    } else {
      mensagem = 'Assinatura cancelada.';
    }

    if (PLANOS_COM_CERTIFICADO_A1.includes(ass.plano) && ass.certificado_a1_emitido_plataforma === true) {
      certificadoCobrado = VALOR_CERTIFICADO_A1;
      valorEstorno = Math.max(0, valorEstorno - certificadoCobrado);
      mensagem += ` Certificado A1 emitido pela plataforma será cobrado no valor de R$ ${VALOR_CERTIFICADO_A1.toFixed(2)}.`;
    } else if (PLANOS_COM_CERTIFICADO_A1.includes(ass.plano)) {
      mensagem += ' Certificado A1 não foi cobrado porque não consta como emitido pela plataforma.';
    }

    let estornoGateway = {
      status: 'sem_estorno',
      mensagem: 'Não havia valor a estornar.'
    };

    if (valorEstorno > 0) {
      try {
        estornoGateway = await estornarPagamento({
          paymentIntentId: ass.gateway_id,
          valor: parseFloat(valorEstorno.toFixed(2)),
          motivo: diasUsados <= PRAZO_ARREPENDIMENTO_DIAS ? 'requested_by_customer' : 'requested_by_customer'
        });
        if (estornoGateway.status === 'succeeded') {
          mensagem += ' Estorno automático enviado à administradora do cartão.';
        } else if (estornoGateway.status === 'nao_enviado') {
          mensagem += ' Estorno calculado, mas sem identificador do gateway para envio automático.';
        } else {
          mensagem += ' Estorno solicitado à administradora e aguardando confirmação.';
        }
      } catch (errEstorno) {
        estornoGateway = {
          status: 'erro',
          erro: errEstorno.message
        };
        mensagem += ' Estorno automático não confirmado; encaminhar para revisão financeira.';
      }
    }

    const recibo = valorEstorno > 0
      ? montarReciboCancelamento({
        ass,
        diasUsados,
        mesesUsados,
        mesesRestantes,
        valorMensalEquivalente,
        valorRestante,
        multa,
        certificadoCobrado,
        valorEstorno,
        estornoGateway
      })
      : null;

    await db.query("UPDATE assinaturas SET status = 'cancelada', data_cancelamento = NOW() WHERE id = $1", [assinatura_id]);
    await db.query(
      `UPDATE assinaturas
       SET valor_estornado = $1,
           estorno_gateway_id = $2,
           estorno_status = $3,
           estorno_resposta = $4,
           cancelamento_recibo = $5
       WHERE id = $6`,
      [
        parseFloat(valorEstorno.toFixed(2)),
        estornoGateway.id || null,
        estornoGateway.status || null,
        JSON.stringify(estornoGateway),
        recibo ? JSON.stringify(recibo) : null,
        assinatura_id
      ]
    );
    await db.query("UPDATE usuarios SET assinatura_ativa = 0, plano = 'freemium' WHERE id = $1", [req.usuario.id]);

    const usuario = await buscarUsuarioContato(req.usuario.id);
    await notificacoes.enviarCancelamento({ usuario, recibo });

    res.json({
      mensagem,
      dias_usados: diasUsados,
      meses_usados: mesesUsados,
      meses_restantes: mesesRestantes,
      dentro_do_prazo: diasUsados <= PRAZO_ARREPENDIMENTO_DIAS,
      valor_mensal_equivalente: parseFloat(valorMensalEquivalente.toFixed(2)),
      saldo_proporcional_restante: parseFloat(valorRestante.toFixed(2)),
      multa: parseFloat(multa.toFixed(2)),
      certificado_cobrado: parseFloat(certificadoCobrado.toFixed(2)),
      valor_estorno: parseFloat(valorEstorno.toFixed(2)),
      estorno_gateway: estornoGateway,
      recibo
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
