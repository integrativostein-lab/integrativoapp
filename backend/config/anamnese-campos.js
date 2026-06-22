/**
 * Schema da anamnese integrativa — Integrativo.App (schema v2.1)
 * Preferência PICS (PNPIC/MS) + medicina ocidental completa.
 * Parte 1: paciente (pré-consulta) · Parte 2: profissional (consulta)
 *
 * SCHEMA_ANAMNESE em shared/versao.js — independente da versão semver da app.
 */

const { SCHEMA_ANAMNESE } = require('../../shared/versao');

const VERSAO_SCHEMA = SCHEMA_ANAMNESE;

function campo(id, nome, categoria, opts = {}) {
  return {
    id,
    nome,
    categoria,
    grupo: opts.grupo || 'transversal',
    parte: opts.parte ?? 1,
    tipo: opts.tipo || 'textarea',
    opcoes: opts.opcoes || null,
    placeholder: opts.placeholder || '',
    ativoPadrao: opts.ativoPadrao !== false,
    obrigatorioPadrao: !!opts.obrigatorioPadrao,
    dica: opts.dica || ''
  };
}

const CAMPOS_ANAMNESE = [
  // —— Identificação e queixa ——
  campo('queixa_principal', 'Queixa principal', 'Identificação e queixa', { grupo: 'ocidental', parte: 1, obrigatorioPadrao: true, placeholder: 'Descreva o motivo principal da consulta' }),
  campo('hda_resumo', 'História da doença atual (HDA)', 'Identificação e queixa', { grupo: 'ocidental', parte: 1, placeholder: 'Início, evolução, intensidade, fatores relacionados' }),
  campo('inicio_sintomas', 'Início dos sintomas', 'Identificação e queixa', { grupo: 'ocidental', parte: 1, tipo: 'text' }),
  campo('evolucao_sintomas', 'Evolução', 'Identificação e queixa', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Aguda', 'Subaguda', 'Crônica', 'Flutuante / intermitente'] }),
  campo('fatores_melhora', 'Fatores de melhora', 'Identificação e queixa', { grupo: 'transversal', parte: 1, tipo: 'text' }),
  campo('fatores_piora', 'Fatores de piora', 'Identificação e queixa', { grupo: 'transversal', parte: 1, tipo: 'text' }),
  campo('tratamentos_tentados_queixa', 'Tratamentos já tentados para a queixa', 'Identificação e queixa', { grupo: 'transversal', parte: 1 }),

  // —— Dados antropométricos ——
  campo('altura_cm', 'Altura (cm)', 'Dados antropométricos', { grupo: 'ocidental', parte: 1, tipo: 'number', placeholder: '170' }),
  campo('peso_kg', 'Peso (kg)', 'Dados antropométricos', { grupo: 'ocidental', parte: 1, tipo: 'number', placeholder: '70' }),
  campo('tipo_sanguineo', 'Tipo sanguíneo', 'Dados antropométricos', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Não informado', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }),

  // —— Antecedentes pessoais (medicina ocidental) ——
  campo('doencas_cronicas', 'Doenças crônicas diagnosticadas', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1, placeholder: 'HAS, DM, dislipidemia, autoimunes, etc.' }),
  campo('cirurgias_previas', 'Cirurgias e procedimentos prévios', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1 }),
  campo('hospitalizacoes', 'Hospitalizações relevantes', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1 }),
  campo('traumatismos', 'Traumatismos / acidentes', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1 }),
  campo('imunizacoes', 'Imunizações (cartão vacinal)', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1 }),
  campo('transfusoes', 'Transfusões sanguíneas prévias', 'Antecedentes pessoais — medicina ocidental', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Não', 'Sim — descrever em observações', 'Não sabe'] }),

  // —— Antecedentes familiares ——
  campo('historico_familiar', 'Histórico familiar relevante', 'Antecedentes familiares', { grupo: 'ocidental', parte: 1, placeholder: 'Diabetes, HAS, câncer, doenças cardíacas, autoimunes, psiquiátricas, etc.' }),
  campo('familiar_pics', 'Histórico familiar de práticas integrativas / fitoterapia', 'Antecedentes familiares', { grupo: 'pics', parte: 1 }),

  // —— Medicações, alergias e farmacovigilância ——
  campo('medicamentos_uso', 'Medicamentos em uso (nome, dose, horário)', 'Medicações, alergias e farmacovigilância', { grupo: 'ocidental', parte: 1, obrigatorioPadrao: true }),
  campo('adesao_medicamentos', 'Adesão ao tratamento medicamentoso', 'Medicações, alergias e farmacovigilância', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Boa', 'Regular', 'Baixa', 'Não usa medicamentos contínuos'] }),
  campo('alergias_medicamentos', 'Alergias e intolerâncias medicamentosas', 'Medicações, alergias e farmacovigilância', { grupo: 'ocidental', parte: 1, obrigatorioPadrao: true, placeholder: 'NKDA ou descrever reações' }),
  campo('alergias_alimentos', 'Alergias alimentares', 'Medicações, alergias e farmacovigilância', { grupo: 'ocidental', parte: 1 }),
  campo('alergias_ambientais', 'Alergias ambientais (pólen, látex, etc.)', 'Medicações, alergias e farmacovigilância', { grupo: 'ocidental', parte: 1 }),
  campo('reacoes_adversas', 'Reações adversas prévias (medicamentos, plantas, suplementos)', 'Medicações, alergias e farmacovigilância', { grupo: 'transversal', parte: 1 }),

  // —— Hábitos de vida ——
  campo('tabagismo', 'Tabagismo', 'Hábitos de vida e autocuidado', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Nunca fumou', 'Ex-fumante', 'Fumante atual — quantidade/dia'] }),
  campo('etilismo', 'Consumo de álcool', 'Hábitos de vida e autocuidado', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Não consome', 'Social / eventual', 'Regular — frequência e quantidade', 'Dependência / risco'] }),
  campo('outras_substancias', 'Outras substâncias (caféina, tabaco ritual, entorpecentes)', 'Hábitos de vida e autocuidado', { grupo: 'transversal', parte: 1 }),
  campo('atividade_fisica', 'Atividade física', 'Hábitos de vida e autocuidado', { grupo: 'transversal', parte: 1, placeholder: 'Tipo, frequência, duração' }),
  campo('tipo_dieta', 'Padrão alimentar', 'Hábitos de vida e autocuidado', { grupo: 'transversal', parte: 1, tipo: 'select', opcoes: ['Onívora', 'Vegetariana', 'Vegana', 'Mediterrânea', 'Low carb / cetogênica', 'Ayurvédica / macrobiótica', 'Jejum intermitente', 'Outro / misto'] }),
  campo('restricoes_alimentares', 'Restrições alimentares e intolerâncias', 'Hábitos de vida e autocuidado', { grupo: 'transversal', parte: 1 }),
  campo('ingestao_agua', 'Ingestão hídrica diária (aprox.)', 'Hábitos de vida e autocuidado', { grupo: 'transversal', parte: 1, tipo: 'text', placeholder: 'Ex: 2 litros/dia' }),

  // —— Avaliação integrativa / constitucional (PICS) ——
  campo('temperamento_ayurveda', 'Constituição / temperamento (Ayurveda)', 'Avaliação integrativa e constitucional', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Vata', 'Pitta', 'Kapha', 'Misto / não avaliado', 'Não se aplica'] }),
  campo('biotipo', 'Biotipo / morfologia', 'Avaliação integrativa e constitucional', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Ectomorfo', 'Mesomorfo', 'Endomorfo', 'Misto', 'Não avaliado'] }),
  campo('constituicao_tcim', 'Constituição (Medicina Tradicional Chinesa)', 'Avaliação integrativa e constitucional', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Yin', 'Yang', 'Qi deficiente', 'Xue deficiente', 'Umidade', 'Calor', 'Frio', 'Misto / não avaliado'] }),
  campo('sensibilidade_climatica', 'Sensibilidade a clima, estações e ambientes', 'Avaliação integrativa e constitucional', { grupo: 'pics', parte: 1 }),
  campo('padrao_energetico', 'Padrão energético percebido (cansado pela manhã/tarde, picos, quedas)', 'Avaliação integrativa e constitucional', { grupo: 'pics', parte: 1 }),

  // —— Digestão, nutrição e eliminações ——
  campo('digestao', 'Qualidade da digestão', 'Digestão, nutrição e eliminações', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Boa', 'Regular', 'Frágil / lenta', 'Rápida / irritável'] }),
  campo('apetite', 'Apetite', 'Digestão, nutrição e eliminações', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Normal', 'Aumentado', 'Diminuído', 'Irregular'] }),
  campo('agni_ayurveda', 'Agni (fogo digestivo — Ayurveda)', 'Digestão, nutrição e eliminações', { grupo: 'pics', parte: 1, tipo: 'select', opcoes: ['Sama (equilibrado)', 'Vishama (irregular)', 'Tikshna (intenso)', 'Manda (lento)', 'Não avaliado'] }),
  campo('evacuacao', 'Evacuações (frequência, consistência, alterações)', 'Digestão, nutrição e eliminações', { grupo: 'transversal', parte: 1 }),
  campo('sintomas_digestivos', 'Sintomas digestivos (azia, refluxo, gases, náusea)', 'Digestão, nutrição e eliminações', { grupo: 'transversal', parte: 1 }),
  campo('miccao', 'Micção (frequência, cor, dor, noctúria)', 'Digestão, nutrição e eliminações', { grupo: 'ocidental', parte: 1 }),
  campo('sudorese', 'Sudorese e termorregulação', 'Digestão, nutrição e eliminações', { grupo: 'pics', parte: 1, tipo: 'text' }),

  // —— Sono, energia e ritmos ——
  campo('horas_sono', 'Horas de sono por noite (média)', 'Sono, energia e ritmos', { grupo: 'transversal', parte: 1, tipo: 'number', placeholder: '7' }),
  campo('qualidade_sono', 'Qualidade do sono', 'Sono, energia e ritmos', { grupo: 'transversal', parte: 1, tipo: 'select', opcoes: ['Boa', 'Regular', 'Ruim', 'Muito ruim'] }),
  campo('disturbios_sono', 'Distúrbios do sono (insônia, despertares, sonolência diurna)', 'Sono, energia e ritmos', { grupo: 'transversal', parte: 1 }),
  campo('ritmo_circadiano', 'Ritmo circadiano e rotina de horários', 'Sono, energia e ritmos', { grupo: 'pics', parte: 1 }),
  campo('nivel_energia', 'Nível de energia (0 = esgotado · 10 = pleno)', 'Sono, energia e ritmos', { grupo: 'transversal', parte: 1, tipo: 'escala', placeholder: '0-10' }),
  campo('nivel_dor', 'Nível de dor atual (EVA 0–10)', 'Sono, energia e ritmos', { grupo: 'ocidental', parte: 1, tipo: 'escala', placeholder: '0-10' }),

  // —— Saúde emocional, mental e espiritual ——
  campo('humor', 'Humour / estado emocional predominante', 'Saúde emocional, mental e espiritual', { grupo: 'pics', parte: 1 }),
  campo('ansiedade', 'Ansiedade percebida (0–10)', 'Saúde emocional, mental e espiritual', { grupo: 'transversal', parte: 1, tipo: 'escala' }),
  campo('estresse', 'Estresse percebido (0–10)', 'Saúde emocional, mental e espiritual', { grupo: 'transversal', parte: 1, tipo: 'escala' }),
  campo('historico_mental', 'Histórico de saúde mental (diagnósticos, acompanhamento)', 'Saúde emocional, mental e espiritual', { grupo: 'ocidental', parte: 1 }),
  campo('praticas_espirituais', 'Práticas espirituais / contemplativas', 'Saúde emocional, mental e espiritual', { grupo: 'pics', parte: 1, placeholder: 'Meditação, oração, rituais, comunidade' }),
  campo('rede_apoio', 'Rede de apoio social e familiar', 'Saúde emocional, mental e espiritual', { grupo: 'transversal', parte: 1 }),
  campo('stressores_vida', 'Eventos estressores recentes ou crônicos', 'Saúde emocional, mental e espiritual', { grupo: 'transversal', parte: 1 }),

  // —— Fitoterapia e plantas medicinais (PICS) ——
  campo('fitoterapia_atual', 'Fitoterapia / plantas medicinais em uso atual', 'Fitoterapia e plantas medicinais', { grupo: 'pics', parte: 1, placeholder: 'Nome popular/científico, forma, dose, tempo de uso' }),
  campo('fitoterapia_previa', 'Fitoterapia / plantas usadas anteriormente', 'Fitoterapia e plantas medicinais', { grupo: 'pics', parte: 1 }),
  campo('chás_ervas_caseras', 'Chás, ervas caseiras e preparos tradicionais', 'Fitoterapia e plantas medicinais', { grupo: 'pics', parte: 1 }),
  campo('renisus_pnpic', 'Plantas da RENISUS/PNPIC já utilizadas', 'Fitoterapia e plantas medicinais', { grupo: 'pics', parte: 1, dica: 'Registre plantas do SUS/PNPIC quando aplicável' }),

  // —— Suplementação e produtos naturais ——
  campo('suplementos_vitaminas', 'Vitaminas e minerais', 'Suplementação e produtos naturais', { grupo: 'pics', parte: 1 }),
  campo('probioticos_prebioticos', 'Probióticos, prebióticos e simbióticos', 'Suplementação e produtos naturais', { grupo: 'pics', parte: 1 }),
  campo('oleos_essenciais', 'Óleos essenciais e aromaterapia', 'Suplementação e produtos naturais', { grupo: 'pics', parte: 1 }),
  campo('homeopatia', 'Homeopatia (medicamentos e potências)', 'Suplementação e produtos naturais', { grupo: 'pics', parte: 1 }),
  campo('outros_produtos_naturais', 'Outros produtos naturais (colágeno, mel, própolis, etc.)', 'Suplementação e produtos naturais', { grupo: 'pics', parte: 1 }),

  // —— Medicina tradicional chinesa e acupuntura ——
  campo('acupuntura_mtc', 'Acupuntura / MTC em uso ou prévia', 'Medicina tradicional chinesa e acupuntura', { grupo: 'pics', parte: 1 }),
  campo('diagnostico_energetico_mtc', 'Diagnóstico energético MTC conhecido (Zang-Fu, meridianos)', 'Medicina tradicional chinesa e acupuntura', { grupo: 'pics', parte: 2 }),
  campo('lingua_pulso_mtc', 'Observação de língua e pulso (MTC) — profissional', 'Medicina tradicional chinesa e acupuntura', { grupo: 'pics', parte: 2 }),

  // —— Ayurveda ——
  campo('ayurveda_tratamentos', 'Tratamentos ayurvédicos em uso (Dinacharya, Rasayana, etc.)', 'Ayurveda', { grupo: 'pics', parte: 1 }),
  campo('ayurveda_observacao_prof', 'Observações ayurvédicas do profissional (Vikriti, Ama, etc.)', 'Ayurveda', { grupo: 'pics', parte: 2 }),

  // —— Terapias corporais e mente-corpo ——
  campo('yoga_meditacao', 'Yoga, meditação, mindfulness', 'Terapias corporais e mente-corpo', { grupo: 'pics', parte: 1 }),
  campo('massagem_terapias_manuais', 'Massoterapia, osteopatia, quiropraxia, RPG', 'Terapias corporais e mente-corpo', { grupo: 'pics', parte: 1 }),
  campo('reiki_energeticas', 'Reiki, terapias bioenergéticas e similares', 'Terapias corporais e mente-corpo', { grupo: 'pics', parte: 1 }),
  campo('danza_movimento', 'Dança, movimento consciente, biodanza', 'Terapias corporais e mente-corpo', { grupo: 'pics', parte: 1 }),

  // —— Outras PICS ——
  campo('apiterapia_ozonio', 'Apiterapia, ozonioterapia e procedimentos complementares', 'Outras práticas integrativas (PICS)', { grupo: 'pics', parte: 1 }),
  campo('etnomedicina', 'Saberes tradicionais / etnomedicina / medicina indígena', 'Outras práticas integrativas (PICS)', { grupo: 'pics', parte: 1, dica: 'Respeitar autodeclaração e contexto cultural' }),
  campo('outras_pics', 'Outras PICS não listadas', 'Outras práticas integrativas (PICS)', { grupo: 'pics', parte: 1 }),

  // —— Exposições ambientais ——
  campo('exposicao_toxicos', 'Exposição a toxinas (agrotóxicos, solventes, metais)', 'Exposições ambientais', { grupo: 'transversal', parte: 1 }),
  campo('mofo_ambiente', 'Exposição a mofo / umidade / ambientes degradados', 'Exposições ambientais', { grupo: 'transversal', parte: 1, tipo: 'select', opcoes: ['Não', 'Sim', 'Não sabe'] }),
  campo('poluicao_ocupacional', 'Riscos ocupacionais e ambientais do trabalho', 'Exposições ambientais', { grupo: 'transversal', parte: 1 }),

  // —— Saúde da mulher ——
  campo('menstruacao', 'Ciclos menstruais (DUM, regularidade, fluxo, dismenorreia)', 'Saúde da mulher', { grupo: 'ocidental', parte: 1 }),
  campo('gestacao_atual', 'Gestação atual', 'Saúde da mulher', { grupo: 'ocidental', parte: 1, tipo: 'select', opcoes: ['Não gestante', 'Gestante', 'Não se aplica'] }),
  campo('historico_gestacional', 'Gestações, partos, abortos, complicações', 'Saúde da mulher', { grupo: 'ocidental', parte: 1 }),
  campo('contraceptivos', 'Anticoncepcionais / hormônios', 'Saúde da mulher', { grupo: 'ocidental', parte: 1 }),
  campo('menopausa_climaterio', 'Menopausa / climatério', 'Saúde da mulher', { grupo: 'ocidental', parte: 1 }),

  // —— Saúde do homem ——
  campo('saude_prostata', 'Saúde prostática / urológica', 'Saúde do homem', { grupo: 'ocidental', parte: 1 }),
  campo('saude_reprodutiva_masculina', 'Saúde reprodutiva masculina / hormônios', 'Saúde do homem', { grupo: 'ocidental', parte: 1 }),

  // —— Revisão por sistemas (medicina ocidental) ——
  campo('sistema_cardiovascular', 'Cardiovascular (dor torácica, palpitações, edema, dispneia)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_respiratorio', 'Respiratório (tosse, dispneia, sibilos, hemoptise)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_gastrointestinal', 'Gastrointestinal (náusea, vômito, diarreia, sangramento)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_neurologico', 'Neurológico (cefaleia, tontura, convulsão, déficit focal)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_musculoesqueletico', 'Musculoesquelético (dor articular, rigidez, trauma)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_dermatologico', 'Dermatológico (lesões, prurido, alterações ungueais)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_geniturinario', 'Geniturinário (disúria, hematúria, secreções)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_endocrino', 'Endócrino (poliúria, polidipsia, intolerância térmica)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),
  campo('sistema_hematologico', 'Hematológico (sangramentos, equimoses, linfonodos)', 'Revisão por sistemas — medicina ocidental', { grupo: 'ocidental', parte: 2 }),

  // —— Exame físico e sinais vitais (profissional) ——
  campo('pressao_arterial', 'Pressão arterial (mmHg)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2, tipo: 'text', placeholder: '120/80' }),
  campo('frequencia_cardiaca', 'Frequência cardíaca (bpm)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2, tipo: 'number' }),
  campo('frequencia_respiratoria', 'Frequência respiratória (irpm)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2, tipo: 'number' }),
  campo('temperatura', 'Temperatura (°C)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2, tipo: 'text' }),
  campo('saturacao_o2', 'SatO₂ (%)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2, tipo: 'text' }),
  campo('exame_fisico_geral', 'Exame físico geral (inspeção, palpação, ausculta)', 'Exame físico e sinais vitais', { grupo: 'ocidental', parte: 2 }),
  campo('semiologia_pics', 'Achados semiológicos integrativos (língua, pulso, pele, aura/energia)', 'Exame físico e sinais vitais', { grupo: 'pics', parte: 2 }),

  // —— Escalas e rastreio ——
  campo('qualidade_vida', 'Qualidade de vida percebida (0–10)', 'Escalas clínicas e rastreio', { grupo: 'transversal', parte: 1, tipo: 'escala' }),
  campo('rastreio_fragilidade', 'Fragilidade / vulnerabilidade', 'Escalas clínicas e rastreio', { grupo: 'ocidental', parte: 2, tipo: 'select', opcoes: ['Baixa', 'Moderada', 'Alta', 'Não avaliado'] }),
  campo('sinais_alarme', 'Sinais de alarme identificados', 'Escalas clínicas e rastreio', { grupo: 'ocidental', parte: 2, placeholder: 'Red flags — encaminhar urgência se aplicável' }),
  campo('comorbidades_risco', 'Comorbidades de risco (HAS, DM, cardiopatia, imunossupressão, gestação, anticoagulação)', 'Escalas clínicas e rastreio', { grupo: 'ocidental', parte: 2 }),

  // —— Objetivos e plano integrativo ——
  campo('objetivos_paciente', 'Objetivos do paciente com o cuidado integrativo', 'Objetivos, expectativas e plano', { grupo: 'transversal', parte: 1 }),
  campo('expectativas_tratamento', 'Expectativas em relação ao profissional e às PICS', 'Objetivos, expectativas e plano', { grupo: 'transversal', parte: 1 }),
  campo('hipoteses_integrativas', 'Hipóteses integrativas / racionalidades clínicas', 'Objetivos, expectativas e plano', { grupo: 'pics', parte: 2 }),
  campo('hipoteses_ocidentais', 'Hipóteses diagnósticas (medicina ocidental / CID quando aplicável)', 'Objetivos, expectativas e plano', { grupo: 'ocidental', parte: 2 }),
  campo('plano_terapeutico_inicial', 'Plano terapêutico integrativo inicial', 'Objetivos, expectativas e plano', { grupo: 'transversal', parte: 2 }),
  campo('encaminhamentos', 'Encaminhamentos e interconsultas', 'Objetivos, expectativas e plano', { grupo: 'ocidental', parte: 2 }),

  // —— Consentimento ——
  campo('consentimento_pics', 'Ciência sobre limites, riscos e benefícios das PICS propostas', 'Consentimento e LGPD', { grupo: 'transversal', parte: 1, tipo: 'select', opcoes: ['Concordo / ciente', 'Desejo mais informações', 'Não se aplica nesta consulta'] }),
  campo('ciencia_teleconsulta', 'Ciência dos limites do atendimento remoto (se teleconsulta)', 'Consentimento e LGPD', { grupo: 'transversal', parte: 1, tipo: 'select', opcoes: ['Ciente', 'Presencial preferido', 'Não se aplica'] }),
  campo('observacoes_livres', 'Observações livres / notas adicionais', 'Consentimento e LGPD', { grupo: 'transversal', parte: 'ambas' })
];

function idsPadraoAtivos() {
  return CAMPOS_ANAMNESE.filter((c) => c.ativoPadrao).map((c) => c.id);
}

function idsPadraoObrigatorios() {
  return CAMPOS_ANAMNESE.filter((c) => c.obrigatorioPadrao).map((c) => c.id);
}

function campoPorId(id) {
  return CAMPOS_ANAMNESE.find((c) => c.id === id) || null;
}

function camposPorCategoria() {
  const map = {};
  CAMPOS_ANAMNESE.forEach((c) => {
    if (!map[c.categoria]) map[c.categoria] = [];
    map[c.categoria].push(c);
  });
  return map;
}

function camposFiltrados({ parte, grupo, idsAtivos } = {}) {
  return CAMPOS_ANAMNESE.filter((c) => {
    if (idsAtivos && !idsAtivos.includes(c.id)) return false;
    if (parte === 1 && c.parte === 2) return false;
    if (parte === 2 && c.parte === 1) return false;
    if (grupo && c.grupo !== grupo && grupo !== 'todos') return false;
    return true;
  });
}

function calcularCamposPendentes(respostasParte1, idsObrigatorios) {
  return (idsObrigatorios || []).filter((id) => {
    const v = respostasParte1?.[id];
    return v === undefined || v === null || String(v).trim() === '';
  });
}

module.exports = {
  VERSAO_SCHEMA,
  CAMPOS_ANAMNESE,
  idsPadraoAtivos,
  idsPadraoObrigatorios,
  campoPorId,
  camposPorCategoria,
  camposFiltrados,
  calcularCamposPendentes
};
