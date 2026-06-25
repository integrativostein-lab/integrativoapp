/**
 * Schema curado da anamnese pública (auto-diagnóstico orientativo).
 * Linguagem acessível ao paciente + checklist de sintomas e medicamentos.
 */
const { campoPorId } = require('./anamnese-campos');

const QUESTIONNAIRE_URL = 'https://integrativo.app/fhir/Questionnaire/anamnese-integrativa-v2.1';

const ETAPAS = [
  {
    id: 'identificacao',
    titulo: 'Sobre você',
    subtitulo: 'Conte o que te trouxe aqui hoje — use suas palavras, sem termos difíceis',
    categorias: ['Dados antropométricos', 'Identificação e queixa']
  },
  {
    id: 'habitos',
    titulo: 'Hábitos e histórico',
    subtitulo: 'Como é seu dia a dia, doenças que já teve e histórico da família',
    categorias: [
      'Hábitos de vida e autocuidado',
      'Antecedentes pessoais — medicina ocidental',
      'Medicações, alergias e farmacovigilância'
    ]
  },
  {
    id: 'medicamentos',
    titulo: 'Remédios que você usa',
    subtitulo: 'Marque os que toma com frequência. Se não usa nenhum, marque a última opção.',
    tipo: 'medicamentos'
  },
  {
    id: 'sintomas',
    titulo: 'O que você sente',
    subtitulo: 'Marque tudo que se encaixa no que você está sentindo agora ou com frequência',
    tipo: 'checklist'
  },
  {
    id: 'sexo_especifico',
    titulo: 'Perguntas extras',
    subtitulo: 'Só aparecem quando fizer sentido para o seu corpo',
    tipo: 'sexo'
  },
  {
    id: 'integrativo',
    titulo: 'Sono, energia e bem-estar',
    subtitulo: 'Como você dorme, sua energia e o que gostaria de melhorar',
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
    'tabagismo', 'tabagismo_cigarros_dia', 'tabagismo_tempo_sem_fumar',
    'etilismo', 'etilismo_frequencia', 'etilismo_doses_por_vez',
    'ingestao_agua', 'atividade_fisica', 'tipo_dieta',
    'doencas_cronicas', 'historico_familiar', 'medicamentos_uso', 'alergias_medicamentos', 'alergias_alimentos'
  ],
  integrativo: [
    'horas_sono', 'qualidade_sono', 'disturbios_sono', 'nivel_energia',
    'ansiedade', 'estresse', 'humor', 'digestao', 'sintomas_digestivos', 'objetivos_paciente'
  ]
};

const ROTULOS_PUBLICOS = {
  sexo_biologico: 'Sexo biológico',
  idade_anos: 'Sua idade (em anos)',
  peso_kg: 'Seu peso (kg)',
  altura_cm: 'Sua altura (cm)',
  queixa_principal: 'O que mais te incomoda hoje?',
  inicio_sintomas: 'Quando começou?',
  evolucao_sintomas: 'Como evoluiu?',
  nivel_dor: 'Nível de dor agora (0 = nenhuma · 10 = a pior possível)',
  ingestao_agua: 'Quanto de água bebe por dia?',
  atividade_fisica: 'Atividade física',
  tipo_dieta: 'Como costuma comer?',
  doencas_cronicas: 'Doenças que você já tem (diabetes, pressão alta, etc.)',
  historico_familiar: 'Alguém da sua família teve doenças importantes?',
  alergias_alimentos: 'Alergia a algum alimento?',
  horas_sono: 'Quantas horas dorme por noite?',
  qualidade_sono: 'Como avalia seu sono?',
  disturbios_sono: 'Problemas para dormir?',
  nivel_energia: 'Sua energia no dia (0 = esgotado · 10 = pleno)',
  ansiedade: 'Ansiedade (0 = tranquilo · 10 = muito ansioso)',
  estresse: 'Estresse (0 = calmo · 10 = muito estressado)',
  humor: 'Como está seu humor?',
  digestao: 'Como está sua digestão?',
  sintomas_digestivos: 'Desconfortos no estômago ou intestino',
  objetivos_paciente: 'O que você gostaria de melhorar na sua saúde?'
};

const DICAS_PUBLICAS = {
  sexo_biologico: 'Usamos só para mostrar perguntas que fazem sentido para o seu corpo.',
  queixa_principal: 'Ex: dor de cabeça forte, ansiedade, azia, cansaço…',
  doencas_cronicas: 'Se não tiver nenhuma, escreva "Nenhuma".',
  historico_familiar: 'Pais, irmãos, avós — diabetes, câncer, coração, depressão…',
  objetivos_paciente: 'Ex: dormir melhor, ter mais energia, aliviar dores…'
};

const SINTOMAS_CHECKLIST = [
  {
    sistema: 'Cabeça e nervos',
    itens: ['Dor de cabeça leve ou por tensão', 'Enxaqueca', 'Dor na nuca', 'Tontura', 'Formigamento']
  },
  {
    sistema: 'Músculos e articulações',
    itens: ['Dor nas costas (lombar)', 'Dor no pescoço', 'Dor nas articulações', 'Dor muscular espalhada', 'Corpo rígido de manhã']
  },
  {
    sistema: 'Coração e respiração',
    itens: ['Coração acelerado', 'Dor no peito', 'Falta de ar', 'Cansaço ao subir escadas', 'Tosse que não passa']
  },
  {
    sistema: 'Estômago e intestino',
    itens: ['Azia ou queimação', 'Dor no estômago', 'Náusea', 'Estufamento ou gases', 'Intestino preso', 'Diarreia']
  },
  {
    sistema: 'Humor e sono',
    itens: ['Ansiedade', 'Dificuldade para dormir', 'Estresse constante', 'Desânimo ou tristeza', 'Irritabilidade']
  },
  {
    sistema: 'Urina e rins',
    itens: ['Dor ao urinar', 'Vontade de urinar toda hora', 'Mudança no xixi', 'Corrimento'],
    sexoAplicavel: 'feminino',
    itensMasculino: ['Dor ao urinar', 'Jato fraco ao urinar', 'Acordar à noite para urinar', 'Desconforto na região pélvica']
  },
  {
    sistema: 'Saúde da mulher',
    itens: ['Cólica menstrual forte', 'Ciclo menstrual irregular', 'Sangramento fora do normal', 'TPM intensa'],
    sexoAplicavel: 'feminino'
  }
];

const MEDICAMENTOS_CHECKLIST = [
  {
    categoria: 'Dor e inflamação',
    itens: ['Paracetamol', 'Dipirona', 'Ibuprofeno', 'Nimesulida', 'Diclofenaco', 'Naproxeno', 'Cetoprofeno', 'Tramadol', 'Codeína']
  },
  {
    categoria: 'Estômago e digestão',
    itens: ['Omeprazol', 'Pantoprazol', 'Ranitidina', 'Antiácidos', 'Domperidona', 'Metoclopramida', 'Simeticona', 'Lactulose', 'Bisacodil']
  },
  {
    categoria: 'Pressão e coração',
    itens: ['Enalapril', 'Losartana', 'Anlodipino', 'Hidroclorotiazida', 'Atenolol', 'Propranolol', 'Carvedilol', 'Aspirina (AAS)', 'Clopidogrel', 'Sinvastatina', 'Atorvastatina']
  },
  {
    categoria: 'Diabetes e açúcar',
    itens: ['Metformina', 'Gliclazida', 'Glibenclamida', 'Insulina', 'Sitagliptina', 'Empagliflozina']
  },
  {
    categoria: 'Tireoide',
    itens: ['Levotiroxina', 'Propiltiouracil', 'Metimazol']
  },
  {
    categoria: 'Humor, ansiedade e sono',
    itens: ['Fluoxetina', 'Sertralina', 'Escitalopram', 'Venlafaxina', 'Amitriptilina', 'Clonazepam', 'Alprazolam', 'Diazepam', 'Zolpidem', 'Melatonina']
  },
  {
    categoria: 'Alergia e respiração',
    itens: ['Loratadina', 'Desloratadina', 'Budesonida inalatória', 'Salbutamol', 'Montelukaste']
  },
  {
    categoria: 'Hormônios e anticoncepcionais',
    itens: ['Anticoncepcional oral', 'Reposição hormonal', 'Espironolactona', 'Prednisona']
  },
  {
    categoria: 'Vitaminas e suplementos',
    itens: ['Vitamina D', 'Complexo B', 'Ferro', 'Ômega-3', 'Magnésio', 'Probióticos']
  },
  {
    categoria: 'Nenhum dos anteriores',
    itens: ['Não uso remédios com frequência'],
    exclusivo: true
  }
];

const CATEGORIAS_SEXO = {
  'Saúde da mulher': 'feminino',
  'Saúde do homem': 'masculino'
};

function aplicarRotuloPublico(campo) {
  if (!campo) return campo;
  const c = { ...campo };
  if (ROTULOS_PUBLICOS[c.id]) c.nome = ROTULOS_PUBLICOS[c.id];
  else if (c.nomePublico) c.nome = c.nomePublico;
  if (DICAS_PUBLICAS[c.id]) c.dica = DICAS_PUBLICAS[c.id];
  else if (c.dicaPublica) c.dica = c.dicaPublica;
  if (c.placeholderPublico) c.placeholder = c.placeholderPublico;
  if (c.categoriaPublica) c.categoria = c.categoriaPublica;
  return c;
}

function normalizarSexo(valor) {
  const v = String(valor || '').toLowerCase();
  if (v.includes('femin')) return 'feminino';
  if (v.includes('masc')) return 'masculino';
  return null;
}

function camposPorEtapas() {
  const map = {};
  ETAPAS.forEach((etapa) => {
    if (etapa.tipo === 'checklist' || etapa.tipo === 'sexo' || etapa.tipo === 'medicamentos') {
      map[etapa.id] = [];
      return;
    }
    const ids = CAMPOS_ETAPA_EXTRA[etapa.id] || [];
    map[etapa.id] = ids.map((id) => aplicarRotuloPublico(campoPorId(id))).filter(Boolean);
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
      return camposFiltrados({ parte: 1 })
        .filter((c) => c.categoria === categoria)
        .map(aplicarRotuloPublico);
    });
}

function idsCamposPublicos() {
  const ids = new Set(['sintomas_relatados', 'medicamentos_marcados']);
  ETAPAS.forEach((etapa) => {
    if (etapa.tipo === 'checklist' || etapa.tipo === 'medicamentos') return;
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
  const campos = todosIds.map((id) => aplicarRotuloPublico(campoPorId(id))).filter(Boolean);

  return {
    questionnaire_url: QUESTIONNAIRE_URL,
    modo_publico: true,
    etapas: ETAPAS,
    campos_por_etapa: Object.fromEntries(
      Object.entries(camposPorEtapa).map(([k, lista]) => [k, lista.map((c) => c.id)])
    ),
    sintomas_checklist: SINTOMAS_CHECKLIST,
    medicamentos_checklist: MEDICAMENTOS_CHECKLIST,
    categorias_sexo: CATEGORIAS_SEXO,
    campos,
    obrigatorios: ['sexo_biologico', 'idade_anos', 'queixa_principal', 'alergias_medicamentos'],
    aviso_destino:
      'O objetivo é ajudar você a decidir se precisa de um profissional de saúde ou de atendimento de urgência. ' +
      'Isso não substitui consulta médica nem diagnóstico.'
  };
}

module.exports = {
  QUESTIONNAIRE_URL,
  ETAPAS,
  SINTOMAS_CHECKLIST,
  MEDICAMENTOS_CHECKLIST,
  CATEGORIAS_SEXO,
  ROTULOS_PUBLICOS,
  normalizarSexo,
  camposSexoEspecificos,
  aplicarRotuloPublico,
  montarSchemaPublico
};
