/**
 * Schema curado da anamnese pública (auto-diagnóstico orientativo).
 * Unifica anamnese clínica + checklist de sintomas + etapas do wizard.
 */
const { campoPorId } = require('./anamnese-campos');

const QUESTIONNAIRE_URL = 'https://integrativo.app/fhir/Questionnaire/anamnese-integrativa-v2.1';

const ETAPAS = [
  {
    id: 'identificacao',
    titulo: 'Identificação e queixa principal',
    subtitulo: 'Dados iniciais no padrão de anamnese clínica',
    categorias: ['Dados antropométricos', 'Identificação e queixa']
  },
  {
    id: 'habitos',
    titulo: 'Hábitos e antecedentes',
    subtitulo: 'Estilo de vida, medicações e histórico relevante',
    categorias: [
      'Hábitos de vida e autocuidado',
      'Antecedentes pessoais — medicina ocidental',
      'Medicações, alergias e farmacovigilância'
    ]
  },
  {
    id: 'sintomas',
    titulo: 'Revisão de sintomas',
    subtitulo: 'Marque o que você sente — revisão por sistemas',
    tipo: 'checklist'
  },
  {
    id: 'sexo_especifico',
    titulo: 'Perguntas específicas',
    subtitulo: 'Conforme sexo biológico informado',
    tipo: 'sexo'
  },
  {
    id: 'integrativo',
    titulo: 'Sono, energia e bem-estar',
    subtitulo: 'Eixos integrativos complementares',
    categorias: [
      'Sono, energia e ritmos',
      'Saúde emocional, mental e espiritual',
      'Digestão, nutrição e eliminações'
    ]
  }
];

const CAMPOS_ETAPA_EXTRA = {
  identificacao: ['sexo_biologico', 'idade_anos', 'peso_kg', 'altura_cm', 'queixa_principal', 'inicio_sintomas', 'evolucao_sintomas', 'nivel_dor'],
  habitos: [
    'tabagismo', 'etilismo', 'ingestao_agua', 'atividade_fisica', 'tipo_dieta',
    'doencas_cronicas', 'historico_familiar', 'medicamentos_uso', 'alergias_medicamentos', 'alergias_alimentos'
  ],
  integrativo: [
    'horas_sono', 'qualidade_sono', 'disturbios_sono', 'nivel_energia',
    'ansiedade', 'estresse', 'humor', 'digestao', 'sintomas_digestivos', 'objetivos_paciente'
  ]
};

const SINTOMAS_CHECKLIST = [
  {
    sistema: 'Neurológico / Cefaleia',
    itens: ['Cefaleia tensional', 'Enxaqueca', 'Dor na nuca', 'Tontura / vertigem', 'Formigamento']
  },
  {
    sistema: 'Musculoesquelético',
    itens: ['Dor lombar', 'Dor cervical', 'Dor articular', 'Dor muscular difusa', 'Rigidez matinal']
  },
  {
    sistema: 'Cardiovascular / Respiratório',
    itens: ['Palpitações', 'Dor torácica', 'Falta de ar', 'Dispneia aos esforços', 'Tosse persistente']
  },
  {
    sistema: 'Digestivo',
    itens: ['Azia / refluxo', 'Gastrite / dor epigástrica', 'Náusea', 'Estufamento / gases', 'Prisão de ventre', 'Diarreia']
  },
  {
    sistema: 'Emocional / Sono',
    itens: ['Ansiedade', 'Insônia', 'Estresse crônico', 'Desânimo / tristeza', 'Irritabilidade']
  },
  {
    sistema: 'Geniturinário',
    itens: ['Disúria (dor ao urinar)', 'Aumento da frequência urinária', 'Alteração do fluxo urinário', 'Corrimento'],
    sexoAplicavel: 'feminino',
    itensMasculino: ['Disúria', 'Jato urinário fraco', 'Noctúria frequente', 'Dor perineal']
  },
  {
    sistema: 'Ginecológico',
    itens: ['Dismenorreia', 'Irregularidade menstrual', 'Sangramento anormal', 'TPM intensa'],
    sexoAplicavel: 'feminino'
  }
];

const CATEGORIAS_SEXO = {
  'Saúde da mulher': 'feminino',
  'Saúde do homem': 'masculino'
};

function normalizarSexo(valor) {
  const v = String(valor || '').toLowerCase();
  if (v.includes('femin')) return 'feminino';
  if (v.includes('masc')) return 'masculino';
  return null;
}

function camposPorEtapas() {
  const map = {};
  ETAPAS.forEach((etapa) => {
    if (etapa.tipo === 'checklist' || etapa.tipo === 'sexo') {
      map[etapa.id] = [];
      return;
    }
    const ids = CAMPOS_ETAPA_EXTRA[etapa.id] || [];
    map[etapa.id] = ids.map((id) => campoPorId(id)).filter(Boolean);
  });
  return map;
}

function camposSexoEspecificos(sexo) {
  const s = normalizarSexo(sexo);
  if (!s) return [];
  return Object.entries(CATEGORIAS_SEXO)
    .filter(([, alvo]) => alvo === s)
    .flatMap(([categoria]) => {
      const { camposFiltrados } = require('./anamnese-campos');
      return camposFiltrados({ parte: 1 }).filter((c) => c.categoria === categoria);
    });
}

function idsCamposPublicos() {
  const ids = new Set(['sintomas_relatados']);
  ETAPAS.forEach((etapa) => {
    if (etapa.tipo === 'checklist') return;
    if (etapa.tipo === 'sexo') {
      Object.keys(CATEGORIAS_SEXO).forEach((cat) => {
        const { camposFiltrados } = require('./anamnese-campos');
        camposFiltrados({ parte: 1 })
          .filter((c) => c.categoria === cat)
          .forEach((c) => ids.add(c.id));
      });
      return;
    }
    CAMPOS_ETAPA_EXTRA[etapa.id]?.forEach((id) => ids.add(id));
  });
  return Array.from(ids);
}

function montarSchemaPublico() {
  const camposPorEtapa = camposPorEtapas();
  const todosIds = idsCamposPublicos();
  const campos = todosIds.map((id) => campoPorId(id)).filter(Boolean);

  return {
    questionnaire_url: QUESTIONNAIRE_URL,
    etapas: ETAPAS,
    campos_por_etapa: Object.fromEntries(
      Object.entries(camposPorEtapa).map(([k, lista]) => [k, lista.map((c) => c.id)])
    ),
    sintomas_checklist: SINTOMAS_CHECKLIST,
    categorias_sexo: CATEGORIAS_SEXO,
    campos,
    obrigatorios: ['sexo_biologico', 'idade_anos', 'queixa_principal', 'medicamentos_uso', 'alergias_medicamentos'],
    aviso_destino:
      'O objetivo desta avaliação é orientar sua busca por um profissional de saúde de confiança. ' +
      'Não substitui consulta, diagnóstico ou emergência médica.'
  };
}

module.exports = {
  QUESTIONNAIRE_URL,
  ETAPAS,
  SINTOMAS_CHECKLIST,
  CATEGORIAS_SEXO,
  normalizarSexo,
  camposSexoEspecificos,
  montarSchemaPublico
};
