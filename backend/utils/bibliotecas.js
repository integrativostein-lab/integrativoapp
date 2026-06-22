const LIMITES_BIBLIOTECAS_PLANO = require('../config/limites-bibliotecas');
const { normalizarPlano } = require('../config/planos');

function normalizarBibliotecas(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try {
    const parsed = JSON.parse(valor);
    if (Array.isArray(parsed)) return normalizarBibliotecas(parsed);
  } catch {
    // Aceita também texto simples separado por vírgulas.
  }
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

function unicas(lista) {
  return Array.from(new Set(lista.filter(Boolean)));
}

function limiteBibliotecasPorPlano(plano) {
  const chave = normalizarPlano(String(plano || 'freemium').trim());
  return LIMITES_BIBLIOTECAS_PLANO[chave] ?? LIMITES_BIBLIOTECAS_PLANO.freemium;
}

function montarBibliotecasCadastro({
  especialidade,
  especialidadeNome,
  bibliotecasSelecionadas,
  especialidadesAdicionais,
  limite,
  plano
}) {
  const bibliotecaPrincipal = String(especialidadeNome || especialidade || '').trim();
  if (!bibliotecaPrincipal) {
    return { erro: 'Especialidade principal inválida' };
  }

  const adicionais = normalizarBibliotecas(especialidadesAdicionais)
    .filter((item) => item !== bibliotecaPrincipal);
  const solicitadas = normalizarBibliotecas(bibliotecasSelecionadas);
  const bibliotecas = unicas(
    solicitadas.length
      ? [bibliotecaPrincipal, ...solicitadas.filter((item) => item !== bibliotecaPrincipal)]
      : [bibliotecaPrincipal, ...adicionais]
  );

  if (bibliotecas.length === 0) {
    return { erro: 'Informe ao menos a biblioteca principal' };
  }
  if (bibliotecas.length > limite) {
    const prefixoPlano = plano ? `Seu plano ${plano} permite` : 'Seu plano permite';
    return {
      erro: `${prefixoPlano} até ${limite} biblioteca(s), incluindo a especialidade principal.`
    };
  }

  return {
    bibliotecaPrincipal,
    bibliotecas,
    adicionais: bibliotecas.slice(1)
  };
}

module.exports = {
  LIMITES_BIBLIOTECAS_PLANO,
  normalizarBibliotecas,
  unicas,
  limiteBibliotecasPorPlano,
  montarBibliotecasCadastro
};
