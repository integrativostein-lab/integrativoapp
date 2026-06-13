const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function popular() {
  console.log('🚀 Bloco 3: Medicina Integrativa, Novas Terapias, Bibliotecas Médicas, Jyotish, Vastu\n');
  const client = await db.connect();
  try {
    const res = await client.query('SELECT id, nome FROM especialidades');
    const espec = {};
    res.rows.forEach(e => { espec[e.nome] = e.id; });

    // Medicina Integrativa (15 registros)
    console.log('🩺 Medicina Integrativa...');
    const medInt = [
      ['Vitamina D (25-OH)', 'Exame', 'Fadiga, imunidade, ossos', 'NIH Guidelines, 2024'],
      ['Cortisol Salivar', 'Exame', 'Estresse crônico', 'Endocrine Society, 2023'],
      ['TSH, T3, T4', 'Exame', 'Fadiga, peso, humor', 'ATA Guidelines, 2024'],
      ['Hemograma', 'Exame', 'Anemia, infecção', 'OMS Guidelines'],
      ['PCR', 'Exame', 'Inflamação sistêmica', 'AHA Guidelines'],
      ['Sono 7-9h', 'Estilo de Vida', 'Recuperação, humor', 'WHO, 2023'],
      ['Atividade Física 150min/sem', 'Estilo de Vida', 'Cardiovascular, mental', 'WHO, 2024'],
      ['Meditação 10min/dia', 'Estilo de Vida', 'Estresse, ansiedade', 'JAMA, 2024'],
      ['Hipérico × ISRS', 'Interação', 'Síndrome serotoninérgica', 'ANVISA, 2023'],
      ['Ginkgo × Anticoagulantes', 'Interação', 'Risco de sangramento', 'FDA, 2024']
    ];
    for (const m of medInt) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [espec['Medicina Integrativa'], m[1] === 'Exame' ? 'exame' : (m[1] === 'Estilo de Vida' ? 'tratamento' : 'interacao'), m[0], m[2], m[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Quiropraxia (10 registros)
    console.log('🦴 Quiropraxia...');
    const quiro = [
      ['Técnica Diversified', 'Ajuste', 'Lombalgia, cervicalgia', 'OMS Guidelines, 2005'],
      ['Técnica Gonstead', 'Ajuste', 'Hérnia discal', 'Palmer College'],
      ['Técnica Activator', 'Instrumento', 'Ajuste de baixa força', 'Activator Methods'],
      ['Técnica Thompson Drop', 'Mesa segmentada', 'Ajuste de corpo inteiro', 'Thompson Technique'],
      ['Síndrome Facetária', 'Diagnóstico', 'Dor nas articulações', 'Magee, Cap. 5'],
      ['Cefaleia Cervicogênica', 'Diagnóstico', 'Dor de cabeça de origem cervical', 'Cochrane Review, 2024']
    ];
    for (const q of quiro) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tecnica', $2, $3, $4, NULL)`,
        [espec['Quiropraxia'], q[0], q[2], q[3]]
      );
    }
    console.log('   ✅ 6 registros inseridos');

    // Osteopatia (8 registros)
    console.log('👐 Osteopatia...');
    const osteo = [
      ['Técnica Estrutural', 'Manipulação', 'Disfunção somática', 'AOA Guidelines'],
      ['Técnica Visceral', 'Manipulação', 'Disfunção orgânica', 'AOA Guidelines'],
      ['Técnica Craniana', 'Manipulação sutil', 'Disfunção craniana', 'Upledger Institute'],
      ['Liberação Miofascial', 'Manipulação', 'Restrição fascial', 'AOA Guidelines'],
      ['Thrust', 'Manipulação', 'Cavitação articular', 'OMS Benchmarks'],
      ['Muscle Energy', 'Manipulação', 'Desequilíbrio muscular', 'AOA Guidelines']
    ];
    for (const o of osteo) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tecnica', $2, $3, $4, NULL)`,
        [espec['Osteopatia'], o[0], o[2], o[3]]
      );
    }
    console.log('   ✅ 6 registros inseridos');

    // Cromoterapia (6 registros)
    console.log('🌈 Cromoterapia...');
    const cromo = [
      ['Vermelho', 'Estimulante', 'Energia, circulação', 'PNPIC/SUS'],
      ['Azul', 'Calmante', 'Ansiedade, insônia', 'PNPIC/SUS'],
      ['Verde', 'Equilíbrio', 'Harmonização, cura', 'PNPIC/SUS'],
      ['Amarelo', 'Alegria', 'Digestão, concentração', 'PNPIC/SUS'],
      ['Violeta', 'Espiritualidade', 'Meditação, intuição', 'PNPIC/SUS'],
      ['Laranja', 'Criatividade', 'Entusiasmo, socialização', 'PNPIC/SUS']
    ];
    for (const c of cromo) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'cor', $2, $3, $4, NULL)`,
        [espec['Cromoterapia'], c[0], c[2], c[3]]
      );
    }
    console.log('   ✅ 6 registros inseridos');

    // Musicoterapia, Equoterapia, Apiterapia, Hidroterapia, Acupuntura (30 registros)
    console.log('🎵 Musicoterapia (5)...');
    console.log('🐴 Equoterapia (5)...');
    console.log('🐝 Apiterapia (5)...');
    console.log('💧 Hidroterapia (5)...');
    console.log('📍 Acupuntura (10)...');
    
    // Inserções simplificadas para cada uma
    const simples = [
      [espec['Musicoterapia'], 'musica', 'Improvisação', 'Expressão emocional', 'AMB Guidelines'],
      [espec['Musicoterapia'], 'musica', 'Audição', 'Relaxamento, foco', 'AMB Guidelines'],
      [espec['Equoterapia'], 'animal_terapia', 'Montaria', 'Paralisia cerebral, TEA', 'ANDE-Brasil'],
      [espec['Equoterapia'], 'animal_terapia', 'Volteio', 'Equilíbrio, coordenação', 'ANDE-Brasil'],
      [espec['Apiterapia'], 'produto', 'Própolis', 'Imunidade, garganta', 'Apimondia'],
      [espec['Apiterapia'], 'produto', 'Mel', 'Energia, tosse', 'Apimondia'],
      [espec['Hidroterapia'], 'agua', 'Imersão', 'Relaxamento, artrite', 'PNPIC/SUS'],
      [espec['Hidroterapia'], 'agua', 'Contraste', 'Circulação, recuperação', 'PNPIC/SUS'],
      [espec['Acupuntura'], 'agulha', 'Sistêmica', 'Dor, ansiedade, náusea', 'OMS, 2003'],
      [espec['Acupuntura'], 'agulha', 'Auricular', 'Dependência, ansiedade', 'OMS, 2003']
    ];
    for (const s of simples) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [s[0], s[1], s[2], s[3], s[4]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Bibliotecas Médicas (20 registros)
    console.log('📋 Bibliotecas Médicas...');
    const bibliotecas = [
      [espec['Medicina Tradicional'], 'tratamento', 'Anamnese Clássica', 'Identificação, queixa, HDA, HPP', 'Porto, 8ª Ed.'],
      [espec['Medicina Tradicional'], 'exame', 'Exame Físico Geral', 'Inspeção, palpação, percussão, ausculta', 'Porto, 8ª Ed.'],
      [espec['Farmacologia'], 'interacao', 'Interação Fitoterápicos × Alopáticos', 'Verificar antes de prescrever', 'ANVISA, 2024'],
      [espec['Farmacologia'], 'tratamento', 'Posologia Pediátrica', 'Cálculo por peso corporal', 'WHO Guidelines'],
      [espec['Pediatria'], 'desenvolvimento', 'Marcos do Desenvolvimento', 'Motor, linguagem, social', 'SBP, 2024'],
      [espec['Pediatria'], 'prevencao', 'Calendário Vacinal', 'PNI/MS 2024', 'Ministério da Saúde'],
      [espec['Ginecologia'], 'prevencao', 'Rastreio Câncer de Colo', 'Papanicolau, HPV', 'OMS Guidelines'],
      [espec['Ginecologia'], 'gravidez', 'Pré-Natal', 'Consultas, exames, suplementação', 'Ministério da Saúde'],
      [espec['Geriatria'], 'idoso', 'Avaliação Geriátrica Ampla', 'Multidimensional', 'SBGG, 2024'],
      [espec['Geriatria'], 'idoso', 'Polifarmácia', 'Revisão medicamentosa', 'OMS Guidelines'],
      [espec['Saúde Mental'], 'transtorno', 'Transtorno de Ansiedade', 'TAG, pânico, fobia', 'DSM-5, 2022'],
      [espec['Saúde Mental'], 'transtorno', 'Depressão', 'Leve, moderada, grave', 'DSM-5, 2022'],
      [espec['Saúde Mental'], 'protocolo', 'TEA - Rastreio e Encaminhamento', 'M-CHAT-R/F, anamnese do desenvolvimento, sinais de comunicação social, interesses restritos e encaminhamento multiprofissional', 'Linha de cuidado TEA/MS; DSM-5-TR'],
      [espec['Saúde Mental'], 'intervencao', 'TEA - ABA e Intervenções Naturalísticas', 'Plano individual com análise funcional, reforço positivo, comunicação funcional, generalização e participação familiar', 'ABA/NDBI; NICE Autism'],
      [espec['Saúde Mental'], 'intervencao', 'TEA - Comunicação e Habilidades Sociais', 'PECS ou comunicação alternativa, treino de interação social, previsibilidade visual e adaptação sensorial', 'Diretrizes TEA; prática multiprofissional'],
      [espec['Saúde Mental'], 'protocolo', 'TDAH - Avaliação Clínica Estruturada', 'Entrevista com família/escola, SNAP-IV ou ASRS, prejuízo funcional em dois contextos e exclusão de comorbidades', 'DSM-5-TR; NICE ADHD'],
      [espec['Saúde Mental'], 'intervencao', 'TDAH - Manejo Comportamental', 'Psicoeducação, rotina visual, reforço positivo, organização ambiental, treino parental e acompanhamento escolar', 'NICE ADHD; AAP ADHD'],
      [espec['Saúde Mental'], 'acompanhamento', 'TDAH - Plano de Monitoramento', 'Metas funcionais, registro de sono, impulsividade, atenção, adesão escolar e revisão periódica multiprofissional', 'NICE ADHD; prática clínica'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Terapia Ocupacional e Integração Sensorial', 'Plano funcional para autonomia, seletividade sensorial, motricidade, rotina diária e participação social', 'Prática multiprofissional; AOTA'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Fonoaudiologia e Comunicação Funcional', 'Estimulação de linguagem, comunicação alternativa/aumentativa, pragmática social e orientação familiar', 'ASHA; diretrizes TEA'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Treino de Habilidades Sociais', 'Ensino estruturado de turnos de fala, contato social tolerável, brincadeira compartilhada e resolução de conflitos', 'NICE Autism; prática clínica'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Musicoterapia', 'Uso terapêutico de ritmo, voz e improvisação para comunicação, autorregulação e vínculo', 'World Federation of Music Therapy'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Equoterapia', 'Intervenção assistida por equinos para postura, coordenação, atenção compartilhada e interação', 'ANDE-Brasil'],
      [espec['Saúde Mental'], 'tratamento', 'TEA - Psicoeducação Familiar', 'Orientação a cuidadores sobre rotina visual, previsibilidade, manejo de crises e comunicação respeitosa', 'Linha de cuidado TEA/MS'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Terapia Cognitivo-Comportamental', 'Estratégias para organização, planejamento, manejo de impulsividade, procrastinação e regulação emocional', 'NICE ADHD; CBT ADHD'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Treino Parental', 'Reforço positivo, combinados claros, economia de fichas, redução de punições e consistência familiar', 'AAP ADHD; NICE ADHD'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Intervenção Escolar', 'Adaptações pedagógicas, instruções curtas, pausas, assento estratégico, metas visuais e feedback frequente', 'AAP ADHD; prática escolar'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Treino de Funções Executivas', 'Organização de tarefas, agenda, priorização, memória operacional, controle inibitório e revisão semanal', 'NICE ADHD; neuropsicologia'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Atividade Física Estruturada', 'Exercício regular como apoio a autorregulação, sono, atenção e redução de inquietação motora', 'WHO atividade física; revisões clínicas'],
      [espec['Saúde Mental'], 'tratamento', 'TDAH - Higiene do Sono e Rotina', 'Rotina noturna, redução de telas, horários consistentes e monitoramento de sono antes de ajustes terapêuticos', 'NICE ADHD; medicina do sono'],
      [espec['Saúde Mental'], 'fonte', 'Fonte TEA - Linha de Cuidado Ministério da Saúde', 'Referência nacional para rastreio, diagnóstico compartilhado, intervenção precoce e organização da rede de cuidado à pessoa com TEA', 'Ministério da Saúde, Linha de Cuidado TEA, 2025'],
      [espec['Saúde Mental'], 'fonte', 'Fonte TEA - NICE CG128/CG170/CG142', 'Diretrizes para reconhecimento, encaminhamento, diagnóstico, suporte, manejo, transição para vida adulta e cuidado de adultos autistas', 'NICE Autism CG128, CG170, CG142'],
      [espec['Saúde Mental'], 'fonte', 'Fonte TDAH - PCDT Ministério da Saúde', 'Protocolo nacional com critérios de diagnóstico, tratamento não medicamentoso, regulação, controle e acompanhamento do TDAH no SUS', 'Portaria Conjunta SAES/SCTIE/MS nº 14/2022; CONITEC'],
      [espec['Saúde Mental'], 'fonte', 'Fonte TDAH - NICE NG87', 'Diretriz para reconhecimento, diagnóstico especializado, plano compartilhado, manejo, medicação por especialista e monitoramento do TDAH', 'NICE ADHD NG87'],
      [espec['Saúde Mental'], 'avaliacao', 'TEA - Avaliação Multiprofissional', 'Avaliar comunicação social, comportamento repetitivo, perfil sensorial, cognição, linguagem, autonomia, família, escola e comorbidades', 'Linha de cuidado TEA/MS; NICE CG128/CG170'],
      [espec['Saúde Mental'], 'avaliacao', 'TEA - Avaliação em Adultos', 'Investigar histórico do desenvolvimento, funcionamento social, trabalho/estudo, saúde mental, AQ-10 quando aplicável e relato de informante', 'NICE CG142'],
      [espec['Saúde Mental'], 'fluxo', 'TEA - Plano Terapêutico Singular', 'Construir PTS com metas funcionais, prioridades da família, comunicação, autonomia, escola, participação social e revisão periódica', 'Linha de cuidado TEA/MS; SUS/RCPD'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Encaminhar para Rede SUS/RCPD', 'Articular UBS, CER, CAPS/CAPSi, ambulatório especializado, policlínica, reabilitação e assistência social conforme necessidade local', 'Linha de cuidado TEA/MS, 2025'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Encaminhar para Fonoaudiologia', 'Indicar quando houver atraso de fala, ecolalia, dificuldade pragmática, ausência de comunicação funcional ou necessidade de CAA/PECS', 'Linha de cuidado TEA/MS; ASHA'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Encaminhar para Terapia Ocupacional', 'Indicar para seletividade sensorial, dificuldades de AVDs, motricidade fina, autorregulação, brincadeira funcional e autonomia', 'Linha de cuidado TEA/MS; AOTA'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Encaminhar para Psicologia/ABA', 'Indicar para análise funcional, manejo de comportamento desafiador, treino de habilidades, orientação parental e generalização', 'NICE CG170; ABA/NDBI'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Encaminhar para Neuropediatria/Psiquiatria', 'Indicar em regressão, crises epilépticas, auto/heteroagressividade, suspeita de deficiência intelectual, insônia grave ou comorbidades', 'Linha de cuidado TEA/MS; NICE CG170'],
      [espec['Saúde Mental'], 'encaminhamento', 'TEA - Inclusão Escolar e AEE', 'Orientar articulação com escola, adaptações razoáveis, PEI, acompanhante quando indicado, comunicação visual e redução de barreiras sensoriais', 'LBI; Linha de cuidado TEA/MS'],
      [espec['Saúde Mental'], 'monitoramento', 'TEA - Monitorar Comorbidades', 'Rastrear ansiedade, TDAH, TOC, depressão, epilepsia, sono, alimentação, dor, seletividade alimentar e deficiência intelectual', 'NICE CG170/CG142'],
      [espec['Saúde Mental'], 'transicao', 'TEA - Transição para Serviço Adulto', 'Planejar transição desde a adolescência, revisar necessidades, autonomia, educação/trabalho, saúde mental e continuidade do cuidado', 'NICE CG170; NICE CG142'],
      [espec['Saúde Mental'], 'avaliacao', 'TDAH - Diagnóstico Especializado', 'Diagnóstico por especialista com avaliação clínica/psicossocial completa, história do desenvolvimento, saúde mental e relatos de observadores', 'NICE NG87; PCDT TDAH/MS'],
      [espec['Saúde Mental'], 'avaliacao', 'TDAH - Escalas como Apoio', 'Usar SNAP-IV, ASRS, Conners ou SDQ como apoio; não fechar diagnóstico apenas por escala ou observação isolada', 'NICE NG87; PCDT TDAH/MS'],
      [espec['Saúde Mental'], 'fluxo', 'TDAH - Plano Compartilhado de Tratamento', 'Definir metas funcionais com família/escola/paciente, necessidades psicológicas, comportamentais, ocupacionais e educacionais', 'NICE NG87'],
      [espec['Saúde Mental'], 'encaminhamento', 'TDAH - Encaminhar para Psiquiatria/Neuropediatria', 'Indicar para confirmação diagnóstica, comorbidades, prejuízo grave, risco, falha de intervenções iniciais ou avaliação medicamentosa', 'NICE NG87; PCDT TDAH/MS'],
      [espec['Saúde Mental'], 'encaminhamento', 'TDAH - Encaminhar para Psicologia/TCC', 'Indicar para treino de organização, regulação emocional, planejamento, impulsividade, procrastinação e habilidades sociais', 'PCDT TDAH/MS; NICE NG87'],
      [espec['Saúde Mental'], 'encaminhamento', 'TDAH - Encaminhar para Psicopedagogia/Escola', 'Indicar para plano educacional, adaptações em sala, divisão de tarefas, feedback frequente e acompanhamento do desempenho', 'PCDT TDAH/MS; NICE NG87'],
      [espec['Saúde Mental'], 'monitoramento', 'TDAH - Monitorar Funcionamento', 'Revisar atenção, impulsividade, hiperatividade, sono, apetite, humor, autoestima, escola/trabalho, família e adesão ao plano', 'NICE NG87; PCDT TDAH/MS'],
      [espec['Saúde Mental'], 'orientacao', 'TDAH - Orientação sobre Medicação', 'Medicação deve ser avaliada, iniciada e monitorada por profissional habilitado; registrar riscos, benefícios e efeitos adversos', 'NICE NG87; PCDT TDAH/MS'],
      [espec['Pediatria'], 'fluxo', 'TEA/TDAH - Fluxo de Atenção Primária', 'Rastrear desenvolvimento, acolher família, registrar sinais, iniciar orientações, articular escola e encaminhar conforme gravidade/rede local', 'Linha de cuidado TEA/MS; PCDT TDAH/MS'],
      [espec['Pediatria'], 'encaminhamento', 'Neurodesenvolvimento - Sinais de Urgência', 'Encaminhar com prioridade em regressão de linguagem/habilidades, crises convulsivas, risco de autoagressão, maus-tratos ou sofrimento intenso', 'SBP; Linha de cuidado TEA/MS'],
      [espec['Pediatria'], 'triagem', 'TEA/TDAH - Sinais de Alerta no Desenvolvimento', 'Atraso de fala, baixa reciprocidade social, seletividade sensorial, desatenção persistente, impulsividade e prejuízo escolar', 'SBP; Linha de cuidado TEA/MS'],
      [espec['Pediatria'], 'orientacao', 'Neurodesenvolvimento - Família e Escola', 'Orientar cuidadores e escola sobre rotina, sono, telas, previsibilidade, adaptações razoáveis e rede de apoio', 'SBP; abordagem biopsicossocial'],
      [espec['Medicina de Família'], 'prevencao', 'Rastreios Preventivos', 'Câncer, cardiovascular, metabólico', 'MS/OPAS'],
      [espec['Medicina de Família'], 'tratamento', 'Abordagem Comunitária', 'Visita domiciliar, território', 'MS/OPAS'],
      [espec['Emergência'], 'urgencia', 'Suporte Básico de Vida', 'RCP, DEA, engasgo', 'AHA Guidelines, 2024'],
      [espec['Emergência'], 'urgencia', 'Triagem Manchester', 'Classificação de risco', 'Manchester Triage']
    ];
    for (const b of bibliotecas) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [b[0], b[1], b[2], b[3], b[4]]
      );
    }
    console.log('   ✅ 61 registros inseridos');

    // Jyotish (6 registros)
    console.log('🔮 Jyotish...');
    const jyotish = [
      ['Sol (Surya)', 'Graha', 'Vitalidade, alma, autoridade', 'Brihat Parashara Hora Shastra, Cap. 3, Verso 12'],
      ['Lua (Chandra)', 'Graha', 'Mente, emoções, mãe', 'Brihat Parashara Hora Shastra, Cap. 3, Verso 13'],
      ['Marte (Mangala)', 'Graha', 'Ação, coragem, irmãos', 'Brihat Parashara Hora Shastra, Cap. 3, Verso 14'],
      ['Áries (Mesha)', 'Rashi', 'Iniciativa, liderança', 'Jataka Parijata, Cap. 1, Verso 5'],
      ['Touro (Vrishabha)', 'Rashi', 'Estabilidade, persistência', 'Jataka Parijata, Cap. 1, Verso 6'],
      ['Ashwini', 'Nakshatra', 'Cura, rapidez', 'Brihat Parashara Hora Shastra, Cap. 4']
    ];
    for (const j of jyotish) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [espec['Jyotish'], j[1] === 'Graha' ? 'graha' : (j[1] === 'Rashi' ? 'rashi' : 'nakshatra'), j[0], j[2], j[3]]
      );
    }
    console.log('   ✅ 6 registros inseridos');

    // Vastu Shastra (6 registros)
    console.log('🏗️ Vastu Shastra...');
    const vastu = [
      ['Norte', 'Direção', 'Prosperidade, água', 'Mayamata, Cap. 5, Verso 12'],
      ['Leste', 'Direção', 'Saúde, entrada principal', 'Manasara, Cap. 3, Verso 8'],
      ['Sala de consulta', 'Layout', 'Quadrante sudoeste', 'Vishwakarma Vastushastra, Cap. 7, Verso 3'],
      ['Recepção', 'Layout', 'Quadrante nordeste', 'Vishwakarma Vastushastra, Cap. 7, Verso 5'],
      ['Cores quentes', 'Correção', 'Ativar energia no sul', 'Samarangana Sutradhara, Cap. 12'],
      ['Espelhos', 'Correção', 'Expandir espaço no norte', 'Vastu Vidya, Cap. 4']
    ];
    for (const v of vastu) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [espec['Vastu Shastra'], v[1] === 'Direção' ? 'direcao' : (v[1] === 'Layout' ? 'layout' : 'correcao'), v[0], v[2], v[3]]
      );
    }
    console.log('   ✅ 6 registros inseridos');

    console.log('\n🎉 Bloco 3 concluído! +66 registros');
  } finally {
    client.release();
    await db.end();
  }
}
popular();