/**
 * Fonte de verdade dos planos no backend (espelha frontend/js/config.js — modelo mensal 2026).
 */
const PLANOS_MENSAIS = {
  freemium: 0,
  guardioes_floresta: 10,
  pro: 99.9,
  clinic: 799,
  enterprise: null
};

const PLANOS_COM_DESCONTO_ABRATH = ['pro', 'clinic'];
const PLANOS_SEM_DESCONTO_PIX = ['guardioes_floresta'];

const PLANOS_RECURSOS = {
  freemium: { comissao_consulta_pct: 0, prescricao: true, recomendacao: true },
  guardioes_floresta: { comissao_consulta_pct: 0, prescricao: false, recomendacao: true },
  pro: { comissao_consulta_pct: 5, prescricao: true, recomendacao: true },
  clinic: { comissao_consulta_pct: 5, prescricao: true, recomendacao: true },
  enterprise: { comissao_consulta_pct: 5, prescricao: true, recomendacao: true }
};

const DESCONTO_PIX = 0.05;
const DESCONTO_ABRATH = 0.08;
const PRAZO_ARREPENDIMENTO_DIAS = 15;

function valorMensalPlano(plano) {
  const key = normalizarPlano(plano);
  if (!Object.prototype.hasOwnProperty.call(PLANOS_MENSAIS, key)) return undefined;
  return PLANOS_MENSAIS[key];
}

function planoCheckoutValido(plano) {
  const valor = valorMensalPlano(plano);
  return valor !== undefined && valor !== null;
}

/** Alias legado: premium → clinic (antigo nome do plano de clínica). */
function normalizarPlano(plano) {
  if (plano === 'premium') return 'clinic';
  return plano;
}

const modoLancamento = require('./modo-lancamento');

function recursosPlano(plano) {
  const key = normalizarPlano(plano);
  let rec;
  if (key === 'guardioes_floresta') rec = { ...PLANOS_RECURSOS.guardioes_floresta };
  else rec = { ...(PLANOS_RECURSOS[key] || PLANOS_RECURSOS.pro) };
  if (modoLancamento.modoLancamento) {
    rec.prescricao = false;
    rec.recomendacao = true;
  }
  return rec;
}

function comissaoConsultaPct(plano) {
  return recursosPlano(plano).comissao_consulta_pct ?? 5;
}

function calcularDataExpiracao({ vitalicio = false, tipoCiclo = 'mensal' } = {}) {
  const data = new Date();
  if (vitalicio) {
    data.setFullYear(2099);
    return data;
  }
  if (tipoCiclo === 'mensal') {
    data.setMonth(data.getMonth() + 1);
    return data;
  }
  data.setFullYear(data.getFullYear() + 1);
  return data;
}

module.exports = {
  PLANOS_MENSAIS,
  PLANOS_COM_DESCONTO_ABRATH,
  PLANOS_SEM_DESCONTO_PIX,
  DESCONTO_PIX,
  DESCONTO_ABRATH,
  PRAZO_ARREPENDIMENTO_DIAS,
  valorMensalPlano,
  planoCheckoutValido,
  normalizarPlano,
  calcularDataExpiracao,
  recursosPlano,
  comissaoConsultaPct,
  PLANOS_RECURSOS
};
