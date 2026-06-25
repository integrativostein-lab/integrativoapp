const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const { verificarRegistroABRATH } = require('../servicos/abrath');
const { estornarPagamento } = require('../config/stripe');
const notificacoes = require('../servicos/notificacoes');
const planosConfig = require('../config/planos');
const { promoverAssinanteComoAdmin } = require('../utils/acesso-roles');

// ============================================
// CONSTANTES DE NEGÓCIO (planos mensais — ver backend/config/planos.js)
// ============================================
const {
  PLANOS_COM_DESCONTO_ABRATH,
  PLANOS_SEM_DESCONTO_PIX,
  DESCONTO_PIX,
  DESCONTO_ABRATH,
  PRAZO_ARREPENDIMENTO_DIAS,
  valorMensalPlano,
  planoCheckoutValido,
  normalizarPlano,
  calcularDataExpiracao
} = planosConfig;

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

async function ehPrimeiraAssinaturaPaga(usuarioId, assinaturaId) {
  const r = await db.query(
    `SELECT COUNT(*) AS total FROM assinaturas
     WHERE usuario_id = $1
       AND id != $2
       AND COALESCE(valor, 0) > 0
       AND status IN ('ativa', 'cancelada', 'expirada', 'suspensa')`,
    [usuarioId, assinaturaId]
  );
  return parseInt(r.rows[0].total, 10) === 0;
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

function arredondarMoeda(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function aplicarDescontoPct(valor, pctDecimal) {
  return arredondarMoeda(Number(valor || 0) * (1 - pctDecimal));
}

function montarReciboCancelamento({ ass, diasUsados, valorEstorno, estornoGateway, acessoAte, tipo }) {
  const linhas = tipo === 'fim_ciclo'
    ? [
      ['Plano', ass.plano],
      ['Valor pago no ciclo mensal', moeda(ass.valor)],
      ['Data de início', new Date(ass.data_inicio).toLocaleDateString('pt-BR')],
      ['Cancelamento solicitado em', new Date().toLocaleDateString('pt-BR')],
      ['Multa', 'Não aplicável'],
      ['Reembolso', 'Não aplicável — ciclo mensal já pago'],
      ['Acesso até', acessoAte],
      ['Renovação automática', 'Desativada — sem nova cobrança mensal']
    ]
    : [
      ['Plano', ass.plano],
      ['Valor pago no ciclo mensal', moeda(ass.valor)],
      ['Data de início', new Date(ass.data_inicio).toLocaleDateString('pt-BR')],
      ['Dias utilizados', `${diasUsados} dia(s)`],
      ['Multa', 'Não aplicável'],
      ['Valor final de reembolso', moeda(valorEstorno)],
      ['Status do estorno', estornoGateway?.status || 'não solicitado']
    ];

  return {
    texto: linhas.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<table border="1" cellpadding="8" cellspacing="0">${linhas.map(([k, v]) => `<tr><th align="left">${k}</th><td>${v}</td></tr>`).join('')}</table>`
  };
}

/**
 * Calcula valor da assinatura com descontos.
 * - PIX => 5% off (2 casas decimais)
 * - Cartão => apenas 1x, sem juros
 */
function calcularParcelamento(valor, parcelas, formaPagamento, aplicarDescontoPix = true) {
  let valorBase = arredondarMoeda(valor);
  let descontoPix = 0;

  if (formaPagamento === 'pix' && aplicarDescontoPix) {
    descontoPix = arredondarMoeda(valorBase * DESCONTO_PIX);
    valorBase = arredondarMoeda(valorBase - descontoPix);
  }

  const n = 1;

  return {
    parcelas: n,
    valorParcela: valorBase,
    valorTotal: valorBase,
    juros: 0,
    desconto_pix: descontoPix
  };
}

// ============================================
// SIMULAÇÃO DE PARCELAMENTO (público / pré-checkout)
// ============================================
router.post('/simular-parcelamento', (req, res) => {
  const { plano, forma_pagamento } = req.body || {};
  if (!planoCheckoutValido(plano)) return res.status(400).json({ erro: 'Plano inválido' });
  const valorBase = valorMensalPlano(plano);
  if (valorBase === 0) {
    return res.json({ plano, parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 });
  }
  const aplicarPix = !PLANOS_SEM_DESCONTO_PIX.includes(plano);
  res.json({
    plano,
    ciclo: 'mensal',
    valor_mensal: valorBase,
    ...calcularParcelamento(valorBase, 1, forma_pagamento, aplicarPix)
  });
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
// ASSINATURA — MODELO MENSAL (ou Freemium)
// ============================================
router.post('/renovar-assinatura', autenticar, async (req, res) => {
  try {
    await garantirColunasAssinaturaPagamento();
    await garantirColunasCartaoUsuario();
    await garantirTabelaValidacaoAssinatura();
    const { plano: planoBody, forma_pagamento, codigo_cupom, abrath_registro, abrath_nome, gateway_id, cartao_final4, cartao_obrigatorio_confirmado } = req.body || {};
    const plano = normalizarPlano(planoBody);

    if (!planoCheckoutValido(plano)) {
      return res.status(400).json({
        erro: plano === 'enterprise'
          ? 'Plano Enterprise é sob consulta. Fale conosco para proposta personalizada.'
          : 'Plano inválido'
      });
    }
    const valorBase = arredondarMoeda(valorMensalPlano(plano));
    const planoGratuito = valorBase === 0;
    let valor = valorBase;
    let vitalicio = false;
    let descontoAplicado = 0;
    const tipoCiclo = 'mensal';

    if (!planoGratuito) {
      if (!cartao_obrigatorio_confirmado || !cartao_final4) {
        return res.status(400).json({ erro: 'Cartão de crédito obrigatório para ativar planos pagos.' });
      }
      await db.query(
        'UPDATE usuarios SET cartao_final4 = $1, cartao_obrigatorio_confirmado = true, cartao_atualizado_em = NOW() WHERE id = $2',
        [String(cartao_final4).slice(-4), req.usuario.id]
      ).catch(() => {});
    }

    const perfil = await db.query(
      'SELECT nome, registro_abrath FROM usuarios WHERE id = $1',
      [req.usuario.id]
    ).catch(() => ({ rows: [] }));
    const registroAbrathUsuario = perfil.rows[0]?.registro_abrath || null;
    const nomeAbrath = abrath_nome || perfil.rows[0]?.nome || req.usuario.nome;
    const registroAbrath = abrath_registro || registroAbrathUsuario;

    // Cupom vitalício especial (single-use)
    if (codigo_cupom && codigo_cupom.toUpperCase() === 'PRESENTEDOMAU' && plano === 'clinic') {
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

    // Desconto ABRATH 8% — vale para Pro e Clinic, independente da forma de pagamento.
    if (!vitalicio && registroAbrath && nomeAbrath && PLANOS_COM_DESCONTO_ABRATH.includes(plano)) {
      const verificado = await verificarRegistroABRATH(registroAbrath, nomeAbrath);
      if (verificado) {
        descontoAplicado = Math.max(descontoAplicado, DESCONTO_ABRATH * 100);
        valor = aplicarDescontoPct(valorBase, DESCONTO_ABRATH);
      }
    }

    const aplicarDescontoPix = !PLANOS_SEM_DESCONTO_PIX.includes(plano);
    const calc = planoGratuito
      ? { parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 }
      : vitalicio
      ? { parcelas: 1, valorParcela: 0, valorTotal: 0, juros: 0, desconto_pix: 0 }
      : calcularParcelamento(valor, 1, forma_pagamento, aplicarDescontoPix);

    const dataExpiracao = calcularDataExpiracao({ vitalicio, tipoCiclo });

    const gatewayResposta = {
      cartao_final4: planoGratuito ? null : (cartao_final4 || null),
      cartao_obrigatorio_confirmado: planoGratuito ? false : !!cartao_obrigatorio_confirmado,
      observacao: gateway_id ? 'Pagamento vinculado ao gateway.' : 'Pagamento registrado sem identificador de gateway; estorno automático depende da administradora configurada.'
    };

    const r = await db.query(
      `INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, parcelas, renovacao_automatica, status, forma_pagamento, gateway_id, gateway_resposta)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, 0, 'pendente_validacao', $7, $8, $9) RETURNING id`,
      [req.usuario.id, plano, vitalicio ? 'vitalicio' : tipoCiclo, calc.valorTotal,
        dataExpiracao.toISOString().split('T')[0], calc.parcelas, forma_pagamento || null, gateway_id || null, JSON.stringify(gatewayResposta)]
    );

    const usuario = await buscarUsuarioContato(req.usuario.id);
    const canais = await criarValidacaoAssinatura({ assinaturaId: r.rows[0].id, usuario });

    res.json({
      mensagem: 'Enviamos um código de validação por WhatsApp e email. Digite o código para ativar sua assinatura.',
      precisa_validacao: true,
      vitalicio,
      plano,
      tipo_ciclo: vitalicio ? 'vitalicio' : tipoCiclo,
      valor_mensal: valorBase,
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

    const promovido = await promoverAssinanteComoAdmin(db, req.usuario.id, ass.plano);
    const perfilAtual = await db.query('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = $1', [req.usuario.id]);
    const usuarioAtual = perfilAtual.rows[0] || null;

    const usuario = await buscarUsuarioContato(req.usuario.id);
    await notificacoes.enviarBoasVindasAssinatura({ usuario });

    res.json({
      mensagem: 'Assinatura validada. Seja bem-vindo(a) ao Integrativo.App!',
      plano: ass.plano,
      assinatura_ativa: !!assinaturaAtiva,
      usuario: usuarioAtual ? {
        id: usuarioAtual.id,
        nome: usuarioAtual.nome,
        email: usuarioAtual.email,
        tipo: usuarioAtual.tipo,
        plano: usuarioAtual.plano
      } : undefined,
      promovido_admin: !!promovido
    });
  } catch (e) {
    console.error('[financeiro/validar-assinatura-codigo]', e.message);
    res.status(500).json({ erro: 'Erro ao validar assinatura' });
  }
});

// ============================================
// CANCELAR ASSINATURA — arrependimento (1ª assinatura, 15 dias) ou fim de ciclo sem multa
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
    const valorAssinatura = parseFloat(ass.valor) || 0;
    const primeiraAssinatura = await ehPrimeiraAssinaturaPaga(req.usuario.id, assinatura_id);
    const elegivelArrependimento = primeiraAssinatura && diasUsados <= PRAZO_ARREPENDIMENTO_DIAS;
    let valorEstorno = 0;
    let mensagem = '';
    let recibo = null;
    let acessoAte = null;

    let estornoGateway = {
      status: 'sem_estorno',
      mensagem: 'Não havia valor a estornar.'
    };

    if (elegivelArrependimento) {
      valorEstorno = valorAssinatura;
      mensagem = `Cancelamento na primeira assinatura, dentro do prazo de ${PRAZO_ARREPENDIMENTO_DIAS} dias — reembolso integral do valor pago.`;

      if (valorEstorno > 0) {
        try {
          estornoGateway = await estornarPagamento({
            paymentIntentId: ass.gateway_id,
            valor: parseFloat(valorEstorno.toFixed(2)),
            motivo: 'requested_by_customer'
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

      recibo = montarReciboCancelamento({
        ass,
        diasUsados,
        valorEstorno,
        estornoGateway,
        tipo: 'reembolso'
      });

      await db.query("UPDATE assinaturas SET status = 'cancelada', data_cancelamento = NOW(), renovacao_automatica = false WHERE id = $1", [assinatura_id]);
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
          JSON.stringify(recibo),
          assinatura_id
        ]
      );
      await db.query("UPDATE usuarios SET assinatura_ativa = 0, plano = 'freemium' WHERE id = $1", [req.usuario.id]);
    } else {
      const dataExpiracao = ass.data_expiracao ? new Date(ass.data_expiracao) : calcularDataExpiracao({ tipoCiclo: ass.tipo_ciclo || 'mensal' });
      acessoAte = dataExpiracao.toLocaleDateString('pt-BR');
      mensagem = `Cancelamento registrado sem multa. Seu acesso permanece ativo até ${acessoAte}. Não haverá nova cobrança mensal.`;

      recibo = montarReciboCancelamento({
        ass,
        diasUsados,
        valorEstorno: 0,
        estornoGateway,
        acessoAte,
        tipo: 'fim_ciclo'
      });

      await db.query(
        `UPDATE assinaturas
         SET renovacao_automatica = false,
             data_cancelamento = NOW(),
             valor_estornado = 0,
             estorno_gateway_id = NULL,
             estorno_status = $1,
             estorno_resposta = $2,
             cancelamento_recibo = $3
         WHERE id = $4`,
        [
          estornoGateway.status,
          JSON.stringify(estornoGateway),
          JSON.stringify(recibo),
          assinatura_id
        ]
      );
    }

    const usuario = await buscarUsuarioContato(req.usuario.id);
    await notificacoes.enviarCancelamento({ usuario, recibo });

    res.json({
      mensagem,
      dias_usados: diasUsados,
      primeira_assinatura: primeiraAssinatura,
      elegivel_arrependimento: elegivelArrependimento,
      multa: 0,
      valor_estorno: parseFloat(valorEstorno.toFixed(2)),
      acesso_ate: acessoAte,
      renovacao_automatica: false,
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
