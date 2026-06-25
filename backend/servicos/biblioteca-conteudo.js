/**
 * Consulta e busca de conteúdo clínico das bibliotecas terapêuticas.
 */
const db = require('../database');

const SECOES_TIPO = {
  protocolo: { titulo: 'Avaliação e diagnóstico', ordem: 1 },
  fonte: { titulo: 'Fontes e referências', ordem: 2 },
  tratamento: { titulo: 'Condutas e tratamentos', ordem: 3 },
  encaminhamento: { titulo: 'Encaminhamento e sinais de alerta', ordem: 4 },
  seguranca: { titulo: 'Segurança e contraindicações', ordem: 5 },
  biblioteca: { titulo: 'Bibliografia complementar', ordem: 6 },
  erva: { titulo: 'Plantas e fitoterápicos', ordem: 7 },
  dosha: { titulo: 'Constituição / doshas', ordem: 8 },
  asana: { titulo: 'Práticas corporais', ordem: 9 },
  tecnica: { titulo: 'Técnicas terapêuticas', ordem: 10 },
  oleo: { titulo: 'Óleos essenciais', ordem: 11 },
  medicamento: { titulo: 'Medicamentos e fármacos', ordem: 12 },
  exame: { titulo: 'Exames e investigação', ordem: 13 },
  interacao: { titulo: 'Interações', ordem: 14 }
};

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function palavrasChave(nomeBiblioteca) {
  const limpo = String(nomeBiblioteca || '').split(':')[0].split('—')[0].split('-')[0].trim();
  const palavras = limpo.split(/\s+/).filter((p) => p.length > 2);
  return [limpo, ...palavras].filter(Boolean);
}

async function resolverEspecialidades(nomeBiblioteca) {
  const chaves = palavrasChave(nomeBiblioteca);
  if (!chaves.length) return [];

  const params = [];
  const condicoes = chaves.map((chave) => {
    params.push(`%${chave}%`);
    return `e.nome ILIKE $${params.length}`;
  });

  const r = await db.query(
    `SELECT DISTINCT e.id, e.nome
     FROM especialidades e
     WHERE ${condicoes.join(' OR ')}
     ORDER BY LENGTH(e.nome) DESC
     LIMIT 8`,
    params
  );
  return r.rows;
}

function secaoDoTipo(tipo) {
  const t = String(tipo || 'outros').toLowerCase();
  return SECOES_TIPO[t] || { titulo: 'Registros clínicos', ordem: 99 };
}

function agruparPorSecao(registros) {
  const mapa = {};
  (registros || []).forEach((item) => {
    const sec = secaoDoTipo(item.tipo);
    const chave = item.tipo || 'outros';
    if (!mapa[chave]) {
      mapa[chave] = { tipo: chave, titulo: sec.titulo, ordem: sec.ordem, itens: [] };
    }
    mapa[chave].itens.push(item);
  });
  return Object.values(mapa).sort((a, b) => a.ordem - b.ordem);
}

async function buscarConteudo({ nomeBiblioteca, busca, tipo, limite = 80, offset = 0 }) {
  const especialidades = await resolverEspecialidades(nomeBiblioteca);
  const ids = especialidades.map((e) => e.id);

  const params = [];
  let i = 1;
  let q = `
    SELECT bt.id, bt.tipo, bt.nome, bt.descricao, bt.contraindicacoes, bt.dosagem_padrao,
           bt.especialidade_id, e.nome AS especialidade_nome
    FROM banco_terapeutico bt
    JOIN especialidades e ON e.id = bt.especialidade_id
    WHERE bt.ativo = 1`;

  if (ids.length) {
    q += ` AND bt.especialidade_id = ANY($${i}::int[])`;
    params.push(ids);
    i++;
  } else {
    const chave = palavrasChave(nomeBiblioteca)[0] || nomeBiblioteca;
    q += ` AND (e.nome ILIKE $${i} OR bt.nome ILIKE $${i})`;
    params.push(`%${chave}%`);
    i++;
  }

  if (tipo) {
    q += ` AND bt.tipo = $${i}`;
    params.push(tipo);
    i++;
  }

  if (busca && String(busca).trim()) {
    const termo = `%${String(busca).trim()}%`;
    q += ` AND (
      bt.nome ILIKE $${i}
      OR COALESCE(bt.descricao, '') ILIKE $${i}
      OR COALESCE(bt.contraindicacoes, '') ILIKE $${i}
      OR COALESCE(bt.dosagem_padrao, '') ILIKE $${i}
    )`;
    params.push(termo);
    i++;
  }

  q += ` ORDER BY
    CASE bt.tipo
      WHEN 'protocolo' THEN 1 WHEN 'fonte' THEN 2 WHEN 'tratamento' THEN 3
      WHEN 'encaminhamento' THEN 4 WHEN 'seguranca' THEN 5 ELSE 6
    END,
    bt.nome ASC
    LIMIT $${i} OFFSET $${i + 1}`;
  params.push(Math.min(Number(limite) || 80, 200), Math.max(Number(offset) || 0, 0));

  const r = await db.query(q, params);
  const registros = r.rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    nome: row.nome,
    descricao: row.descricao,
    contraindicacoes: row.contraindicacoes,
    referencia: row.dosagem_padrao,
    especialidade_id: row.especialidade_id,
    especialidade_nome: row.especialidade_nome
  }));

  return {
    biblioteca: nomeBiblioteca,
    especialidades_vinculadas: especialidades,
    total: registros.length,
    registros,
    secoes: agruparPorSecao(registros),
    tipos_disponiveis: Object.keys(SECOES_TIPO)
  };
}

async function pesquisarGlobal({ termo, bibliotecasPermitidas, limite = 40 }) {
  if (!termo || !String(termo).trim()) {
    return { total: 0, resultados: [] };
  }

  const like = `%${String(termo).trim()}%`;
  const params = [like];
  let filtroEsp = '';

  if (Array.isArray(bibliotecasPermitidas) && bibliotecasPermitidas.length) {
    const partes = bibliotecasPermitidas.map((nome, idx) => {
      params.push(`%${palavrasChave(nome)[0] || nome}%`);
      return `e.nome ILIKE $${idx + 2}`;
    });
    filtroEsp = ` AND (${partes.join(' OR ')})`;
  }

  const r = await db.query(
    `SELECT bt.id, bt.tipo, bt.nome, bt.descricao, bt.contraindicacoes, bt.dosagem_padrao,
            e.nome AS especialidade_nome
     FROM banco_terapeutico bt
     JOIN especialidades e ON e.id = bt.especialidade_id
     WHERE bt.ativo = 1
       AND (
         bt.nome ILIKE $1
         OR COALESCE(bt.descricao, '') ILIKE $1
         OR COALESCE(bt.contraindicacoes, '') ILIKE $1
         OR COALESCE(bt.dosagem_padrao, '') ILIKE $1
       )
       ${filtroEsp}
     ORDER BY bt.nome ASC
     LIMIT ${Math.min(Number(limite) || 40, 100)}`,
    params
  );

  return {
    termo: String(termo).trim(),
    total: r.rows.length,
    resultados: r.rows
  };
}

module.exports = {
  SECOES_TIPO,
  resolverEspecialidades,
  buscarConteudo,
  pesquisarGlobal,
  agruparPorSecao
};
