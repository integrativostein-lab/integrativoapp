const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const especialidades = [
  {
    nome: 'Fitoterapia',
    fonte: 'PNPIC/MS; RENISUS/MS; ANVISA; WHO Monographs on Selected Medicinal Plants',
    avaliacao: 'Identificar queixa principal, medicamentos em uso, alergias, gestação/lactação, função hepática/renal e risco de interação planta-medicamento.',
    tratamento: 'Selecionar planta medicinal com evidência compatível, forma farmacêutica segura, tempo de uso definido e orientação de sinais de suspensão.',
    encaminhamento: 'Encaminhar para médico/farmacêutico em uso de anticoagulantes, imunossupressores, psicotrópicos, gestação, lactação, hepatopatia, nefropatia ou sintomas graves.',
    seguranca: 'Evitar promessas terapêuticas, automedicação prolongada e associações sem checagem de interação; registrar lote, dose, via e evolução.'
  },
  {
    nome: 'Ayurveda',
    fonte: 'WHO Benchmarks for Training in Ayurveda; Ministry of AYUSH; literatura clássica ayurvédica; PNPIC/MS',
    avaliacao: 'Avaliar prakriti/vikriti, agni, ama, rotina, sono, digestão, alimentação, uso de ervas, medicamentos e sinais clínicos de gravidade.',
    tratamento: 'Usar plano individual com dinacharya, ahara, práticas mente-corpo, orientação alimentar e ervas apenas quando houver segurança e competência profissional.',
    encaminhamento: 'Encaminhar para serviço médico em perda de peso inexplicada, febre persistente, dor intensa, sangramento, sintomas neurológicos ou uso de metais/preparações complexas.',
    seguranca: 'Evitar formulações sem procedência, metais pesados, suspensão de tratamento convencional e condutas fora da formação do profissional.'
  },
  {
    nome: 'MTC',
    fonte: 'WHO Benchmarks for Training in Traditional Chinese Medicine; PNPIC/MS; diretrizes de segurança em acupuntura',
    avaliacao: 'Avaliar padrões energéticos, sinais/sintomas, língua, pulso quando aplicável, contraindicações e diagnóstico biomédico conhecido.',
    tratamento: 'Combinar orientação de estilo de vida, dietética chinesa, práticas corporais, acupuntura/moxabustão/auriculoterapia conforme formação e indicação.',
    encaminhamento: 'Encaminhar urgência em déficit neurológico, dor torácica, dispneia, febre alta, trauma, infecção, gestação de risco ou piora progressiva.',
    seguranca: 'Usar técnica asséptica, consentimento, agulhas descartáveis e evitar pontos/recursos contraindicados para gestantes ou pacientes frágeis.'
  },
  {
    nome: 'Yoga',
    fonte: 'WHO Guidelines on Physical Activity; Yoga in Healthcare Alliance; PNPIC/MS; revisões sistemáticas Cochrane quando disponíveis',
    avaliacao: 'Avaliar condicionamento, mobilidade, pressão arterial, dor, saúde mental, gestação, equilíbrio, limitações funcionais e objetivos do praticante.',
    tratamento: 'Prescrever prática progressiva com asanas adaptados, pranayama leve, relaxamento, meditação e educação corporal centrada em segurança.',
    encaminhamento: 'Encaminhar para avaliação médica/fisioterapêutica em dor aguda, síncope, hipertensão não controlada, pós-operatório, gestação de risco ou déficit neurológico.',
    seguranca: 'Evitar hiperventilação, retenções longas, inversões e posturas avançadas sem preparo; adaptar para idosos, crianças e pessoas com dor.'
  },
  {
    nome: 'Massoterapia',
    fonte: 'AMTA clinical practice resources; NCCIH massage therapy; diretrizes de segurança em terapias manuais',
    avaliacao: 'Avaliar dor, pele, circulação, histórico de trombose, câncer, febre, infecção, osteoporose, uso de anticoagulantes e preferência de pressão.',
    tratamento: 'Aplicar técnicas de relaxamento, liberação miofascial leve, drenagem quando habilitado e plano de frequência com reavaliação de dor/função.',
    encaminhamento: 'Encaminhar em dor inexplicada, edema unilateral, suspeita de trombose, febre, lesão de pele, perda de força ou sintomas neurológicos.',
    seguranca: 'Evitar manipulação sobre fraturas, trombose, infecção, feridas, tumores, áreas inflamadas e pressão profunda em anticoagulados.'
  },
  {
    nome: 'Aromaterapia',
    fonte: 'Tisserand & Young, Essential Oil Safety; IFPA safety guidance; ANVISA cosméticos e óleos essenciais',
    avaliacao: 'Avaliar idade, gestação, lactação, epilepsia, asma, alergias, pele sensível, medicamentos e objetivo terapêutico.',
    tratamento: 'Usar óleos essenciais com diluição adequada, via segura, tempo limitado, teste de sensibilidade e orientação escrita.',
    encaminhamento: 'Encaminhar em reação alérgica, broncoespasmo, queimadura química, intoxicação, gestação de risco, lactentes ou doenças respiratórias graves.',
    seguranca: 'Evitar ingestão, uso puro na pele, fototóxicos antes de sol, óleos neurotóxicos em epilepsia e uso sem diluição em crianças.'
  },
  {
    nome: 'Fisioterapia',
    fonte: 'COFFITO; WCPT/World Physiotherapy; NICE musculoskeletal guidance; diretrizes clínicas por condição',
    avaliacao: 'Avaliar dor, função, amplitude, força, marcha, sinais neurológicos, bandeiras vermelhas, objetivos funcionais e medidas de desfecho.',
    tratamento: 'Usar exercício terapêutico, educação, terapia manual, eletrotermofototerapia e progressão funcional conforme diagnóstico cinético-funcional.',
    encaminhamento: 'Encaminhar em trauma grave, cauda equina, déficit progressivo, febre, perda ponderal, dor noturna persistente ou suspeita vascular.',
    seguranca: 'Registrar avaliação, metas, contraindicações e evolução; evitar recursos sem indicação ou sem monitoramento de resposta.'
  },
  {
    nome: 'Xamanismo',
    fonte: 'PNPIC/MS; OMS sobre práticas tradicionais; princípios de segurança cultural, consentimento e redução de danos',
    avaliacao: 'Avaliar contexto cultural, crenças, rede de apoio, saúde mental, uso de substâncias, vulnerabilidade e expectativas do participante.',
    tratamento: 'Oferecer práticas simbólicas, rituais não invasivos, canto, tambor, roda de conversa e integração respeitosa quando houver consentimento.',
    encaminhamento: 'Encaminhar em psicose, risco suicida, mania, intoxicação, abuso, trauma grave ou sofrimento mental intenso.',
    seguranca: 'Não usar substâncias psicoativas sem amparo legal e clínico; preservar autonomia, cultura, confidencialidade e não substituir cuidado médico.'
  },
  {
    nome: 'Florais de Bach',
    fonte: 'Bach Centre; PNPIC/MS; revisões de práticas integrativas e placebo/contexto terapêutico',
    avaliacao: 'Avaliar estado emocional, estressores, rede de apoio, risco de autoagressão, uso de psicotrópicos e necessidade de psicoterapia/psiquiatria.',
    tratamento: 'Selecionar floral como recurso complementar para autocuidado emocional, com metas subjetivas e reavaliação periódica.',
    encaminhamento: 'Encaminhar imediatamente em ideação suicida, violência, crise de pânico incapacitante, psicose, depressão grave ou piora funcional.',
    seguranca: 'Explicar caráter complementar, não suspender medicação, evitar promessas de cura e monitorar sinais de agravamento.'
  },
  {
    nome: 'Reiki',
    fonte: 'PNPIC/MS; NCCIH Reiki; estudos de terapias de toque/relaxamento como cuidado complementar',
    avaliacao: 'Avaliar objetivo do cuidado, dor, ansiedade, fadiga, preferências, crenças, consentimento e condições que exigem cuidado convencional.',
    tratamento: 'Oferecer sessão de relaxamento e imposição de mãos sem invasão, com ambiente seguro, acolhimento e registro de resposta subjetiva.',
    encaminhamento: 'Encaminhar em sintomas agudos, dor intensa, dispneia, febre, alteração neurológica, risco emocional ou piora clínica.',
    seguranca: 'Não substituir diagnóstico/tratamento; manter consentimento, limites profissionais, privacidade e linguagem sem promessa de cura.'
  },
  {
    nome: 'Reflexologia',
    fonte: 'PNPIC/MS; International Council of Reflexologists; diretrizes de segurança em terapias manuais',
    avaliacao: 'Avaliar dor, pele, neuropatia, diabetes, circulação, gestação, trombose, fraturas, sensibilidade e objetivos de relaxamento.',
    tratamento: 'Aplicar pressão progressiva em zonas reflexas, com monitoramento de conforto, hidratação e reavaliação de sintomas.',
    encaminhamento: 'Encaminhar em pé diabético, feridas, infecção, suspeita de trombose, dor aguda intensa, perda sensitiva ou edema unilateral.',
    seguranca: 'Evitar pressão em lesões, varizes inflamadas, fraturas, feridas, neuropatia grave e gestação de risco sem liberação.'
  },
  {
    nome: 'Medicina Integrativa',
    fonte: 'Academic Consortium for Integrative Medicine; NCCIH; PNPIC/MS; OMS cuidado centrado na pessoa',
    avaliacao: 'Avaliar diagnóstico biomédico, objetivos do paciente, medicamentos, suplementos, estilo de vida, saúde mental, riscos e preferências.',
    tratamento: 'Criar plano integrado com autocuidado, nutrição, sono, atividade física, mente-corpo, práticas complementares e coordenação com equipe.',
    encaminhamento: 'Encaminhar para especialista diante de bandeiras vermelhas, falha terapêutica, comorbidade complexa ou necessidade diagnóstica.',
    seguranca: 'Checar interações, evidência, contraindicações e consentimento; não atrasar tratamento efetivo para condições graves.'
  },
  {
    nome: 'Jyotish',
    fonte: 'Literatura clássica Jyotish; princípios éticos de aconselhamento; segurança em saúde mental',
    avaliacao: 'Avaliar demanda simbólica, contexto emocional, crenças, vulnerabilidade, autonomia e risco de decisões prejudiciais.',
    tratamento: 'Usar leitura como prática reflexiva e cultural, focada em autoconhecimento, escolhas conscientes e organização de metas.',
    encaminhamento: 'Encaminhar em sofrimento psíquico intenso, delírios, dependência de previsões, risco suicida ou decisões médicas/legais baseadas apenas na leitura.',
    seguranca: 'Evitar determinismo, medo, promessas, decisões clínicas e dependência; preservar autonomia e confidencialidade.'
  },
  {
    nome: 'Vastu Shastra',
    fonte: 'Textos tradicionais de Vastu; ergonomia ambiental; WHO healthy housing principles',
    avaliacao: 'Avaliar ambiente, ventilação, iluminação, ruído, circulação, ergonomia, segurança, sono e percepção subjetiva do espaço.',
    tratamento: 'Sugerir ajustes não invasivos de organização, luz, ventilação, áreas de descanso, rotina e sensação de acolhimento.',
    encaminhamento: 'Encaminhar para arquiteto/engenheiro quando houver mofo, elétrica, estrutura, acessibilidade, ventilação inadequada ou risco ambiental.',
    seguranca: 'Evitar intervenções estruturais sem profissional habilitado e promessas de cura; priorizar segurança, acessibilidade e bem-estar.'
  },
  {
    nome: 'Quiropraxia',
    fonte: 'WHO Guidelines on Basic Training and Safety in Chiropractic; diretrizes de bandeiras vermelhas em dor espinhal',
    avaliacao: 'Avaliar dor, mobilidade, neurologia, trauma, osteoporose, anticoagulação, sintomas sistêmicos e contraindicações de manipulação.',
    tratamento: 'Usar educação, exercício, mobilização/manipulação quando indicada, ergonomia e plano de reavaliação funcional.',
    encaminhamento: 'Encaminhar em déficit neurológico, trauma, suspeita de fratura, câncer, infecção, cauda equina, AVC ou dor cervical com sinais vasculares.',
    seguranca: 'Evitar manipulação cervical de alto risco sem triagem rigorosa; documentar consentimento, riscos e resposta.'
  },
  {
    nome: 'Osteopatia',
    fonte: 'WHO Benchmarks for Training in Osteopathy; diretrizes de segurança em terapia manual',
    avaliacao: 'Avaliar queixa, mobilidade, postura, função, bandeiras vermelhas, histórico clínico, medicamentos e objetivos do cuidado.',
    tratamento: 'Aplicar técnicas estruturais, miofasciais, funcionais ou cranianas conforme formação, segurança e resposta do paciente.',
    encaminhamento: 'Encaminhar em trauma, febre, perda de peso, déficit neurológico, dor torácica, suspeita vascular, infecção ou câncer.',
    seguranca: 'Evitar técnica de alta velocidade em osteoporose, anticoagulação, instabilidade, fragilidade ou contraindicação clínica.'
  },
  {
    nome: 'Cromoterapia',
    fonte: 'PNPIC/MS; literatura de práticas integrativas; princípios de cuidado complementar e segurança ocular',
    avaliacao: 'Avaliar objetivo subjetivo, sensibilidade à luz, epilepsia fotossensível, enxaqueca, condições oftalmológicas e expectativas.',
    tratamento: 'Usar exposição suave a cores/ambiente como apoio ao relaxamento, meditação e percepção corporal, com duração limitada.',
    encaminhamento: 'Encaminhar em alteração visual, crise convulsiva, fotofobia intensa, enxaqueca incapacitante ou sintomas neurológicos.',
    seguranca: 'Não usar luz intensa nos olhos, lasers ou promessas terapêuticas; respeitar conforto e contraindicações.'
  },
  {
    nome: 'Musicoterapia',
    fonte: 'World Federation of Music Therapy; AMTA Standards of Practice; NICE Autism support guidance',
    avaliacao: 'Avaliar objetivos emocionais, comunicação, sensibilidade auditiva, cognição, comportamento, preferências musicais e vínculo.',
    tratamento: 'Usar escuta, improvisação, ritmo, canto, composição e interação musical para comunicação, regulação emocional e expressão.',
    encaminhamento: 'Encaminhar em sofrimento grave, risco suicida, psicose, hipersensibilidade auditiva severa ou comorbidades que exijam equipe especializada.',
    seguranca: 'Regular volume, evitar sobrecarga sensorial, obter consentimento e documentar objetivos terapêuticos.'
  },
  {
    nome: 'Equoterapia',
    fonte: 'ANDE-Brasil; diretrizes de terapia assistida por equinos; segurança em reabilitação',
    avaliacao: 'Avaliar tônus, equilíbrio, epilepsia, alergias, medo, controle cervical/tronco, peso, comportamento e liberação médica quando necessário.',
    tratamento: 'Planejar montaria terapêutica, condução, atividades psicomotoras e objetivos funcionais com equipe habilitada.',
    encaminhamento: 'Encaminhar para médico/fisioterapeuta em epilepsia não controlada, instabilidade cervical, luxação de quadril, escoliose grave ou dor.',
    seguranca: 'Usar capacete, equipe treinada, animal adequado, consentimento e critérios de suspensão por fadiga, medo ou risco.'
  },
  {
    nome: 'Apiterapia',
    fonte: 'Apimondia; literatura de produtos apícolas; ANVISA; diretrizes de alergia/anafilaxia',
    avaliacao: 'Avaliar alergia a abelha/própolis/mel, asma, anafilaxia prévia, gestação, imunossupressão, diabetes e uso de anticoagulantes.',
    tratamento: 'Usar produtos apícolas apenas como complemento, com procedência, dose conservadora e orientação de reação alérgica.',
    encaminhamento: 'Encaminhar imediatamente em urticária generalizada, edema de glote, dispneia, hipotensão ou suspeita de anafilaxia.',
    seguranca: 'Evitar veneno de abelha fora de ambiente habilitado; não usar em alérgicos e registrar consentimento/risco.'
  },
  {
    nome: 'Hidroterapia',
    fonte: 'World Physiotherapy aquatic therapy resources; diretrizes de reabilitação aquática; segurança em piscina terapêutica',
    avaliacao: 'Avaliar mobilidade, pele, feridas, continência, função cardiorrespiratória, equilíbrio, medo de água e contraindicações.',
    tratamento: 'Usar exercícios aquáticos progressivos para dor, mobilidade, força, equilíbrio e relaxamento com supervisão.',
    encaminhamento: 'Encaminhar em feridas abertas, infecção, febre, insuficiência cardíaca descompensada, epilepsia não controlada ou dispneia.',
    seguranca: 'Monitorar temperatura, fadiga, hidratação, risco de queda/afogamento e qualidade da água.'
  },
  {
    nome: 'Acupuntura',
    fonte: 'WHO Benchmarks for Training in Acupuncture; PNPIC/MS; diretrizes de biossegurança em acupuntura',
    avaliacao: 'Avaliar diagnóstico, padrão energético, dor, gestação, anticoagulação, imunossupressão, síncope prévia e risco infeccioso.',
    tratamento: 'Usar pontos com indicação, técnica asséptica, agulha descartável, tempo definido e reavaliação de sintomas.',
    encaminhamento: 'Encaminhar em dor torácica, déficit neurológico, febre, infecção, trauma, sangramento, gestação de risco ou piora clínica.',
    seguranca: 'Evitar pneumotórax, sangramento, pontos contraindicados na gestação e técnica sem formação adequada.'
  },
  {
    nome: 'Medicina Tradicional',
    fonte: 'Ministério da Saúde; protocolos clínicos oficiais; OMS; diretrizes de atenção baseada em evidências',
    avaliacao: 'Realizar anamnese, exame físico, hipóteses diagnósticas, estratificação de risco, exames quando indicados e plano compartilhado.',
    tratamento: 'Aplicar condutas baseadas em diretrizes clínicas, preferências do paciente, segurança, efetividade e acompanhamento.',
    encaminhamento: 'Encaminhar conforme gravidade, sinais de alarme, necessidade de especialista, urgência ou recursos diagnósticos/terapêuticos.',
    seguranca: 'Registrar consentimento, alergias, interações, eventos adversos, retorno e orientação de sinais de alerta.'
  },
  {
    nome: 'Farmacologia',
    fonte: 'ANVISA; Bula profissional; Micromedex/Lexicomp quando disponível; protocolos oficiais e farmacovigilância',
    avaliacao: 'Reconciliar medicamentos, dose, adesão, alergias, função renal/hepática, interações, duplicidades e automedicação.',
    tratamento: 'Apoiar uso racional de medicamentos, educação, posologia segura, revisão terapêutica e monitoramento de efeitos adversos.',
    encaminhamento: 'Encaminhar ao prescritor em reação adversa grave, interação relevante, dose insegura, gestação, lactação ou falha terapêutica.',
    seguranca: 'Não prescrever fora da habilitação; registrar orientação, sinais de intoxicação e necessidade de farmacovigilância.'
  },
  {
    nome: 'Pediatria',
    fonte: 'Sociedade Brasileira de Pediatria; Ministério da Saúde; Caderneta da Criança; NICE quando aplicável',
    avaliacao: 'Avaliar crescimento, desenvolvimento, vacinação, alimentação, sono, vínculo, segurança, escola, neurodesenvolvimento e sinais de alerta.',
    tratamento: 'Orientar promoção de saúde, prevenção, manejo inicial, acompanhamento longitudinal e cuidado centrado na família.',
    encaminhamento: 'Encaminhar em atraso/regressão do desenvolvimento, desidratação, dispneia, febre em lactente, convulsão, maus-tratos ou risco grave.',
    seguranca: 'Usar dose por peso, evitar automedicação, registrar responsáveis e priorizar sinais de alarme.'
  },
  {
    nome: 'Ginecologia',
    fonte: 'FEBRASGO; Ministério da Saúde; OMS sexual and reproductive health; diretrizes de rastreamento',
    avaliacao: 'Avaliar ciclo, dor, sangramento, gestação, contracepção, ISTs, violência, rastreamentos e fatores de risco.',
    tratamento: 'Realizar cuidado preventivo, orientação contraceptiva, saúde sexual, manejo inicial e plano de seguimento conforme diretriz.',
    encaminhamento: 'Encaminhar em sangramento intenso, dor pélvica aguda, gestação de risco, violência sexual, massa pélvica ou suspeita oncológica.',
    seguranca: 'Garantir consentimento, privacidade, abordagem livre de julgamento e documentação adequada.'
  },
  {
    nome: 'Geriatria',
    fonte: 'Sociedade Brasileira de Geriatria e Gerontologia; OMS ICOPE; Beers Criteria; Ministério da Saúde',
    avaliacao: 'Realizar avaliação geriátrica ampla: funcionalidade, cognição, humor, quedas, nutrição, polifarmácia, suporte social e fragilidade.',
    tratamento: 'Planejar cuidado centrado em funcionalidade, prevenção de quedas, revisão medicamentosa, exercício, nutrição e autonomia.',
    encaminhamento: 'Encaminhar em delirium, queda com trauma, perda funcional súbita, maus-tratos, demência avançada, desnutrição ou polifarmácia complexa.',
    seguranca: 'Evitar cascata medicamentosa, doses inadequadas, contenção sem critério e intervenções sem meta funcional.'
  },
  {
    nome: 'Saúde Mental',
    fonte: 'DSM-5-TR; CID-11; Ministério da Saúde/RAPS; NICE mental health guidelines',
    avaliacao: 'Avaliar risco suicida, psicose, humor, ansiedade, trauma, substâncias, sono, funcionamento, rede de apoio e comorbidades.',
    tratamento: 'Criar plano terapêutico com psicoterapia, psicoeducação, autocuidado, rede de apoio, intervenção de crise e psiquiatria quando indicada.',
    encaminhamento: 'Encaminhar urgência em risco suicida, psicose, mania, intoxicação, abstinência, violência, negligência ou incapacidade funcional grave.',
    seguranca: 'Registrar risco, plano de segurança, contatos de apoio, consentimento e limites do cuidado complementar.'
  },
  {
    nome: 'Medicina de Família',
    fonte: 'Ministério da Saúde APS; WONCA; protocolos de Atenção Primária; OPAS/OMS',
    avaliacao: 'Avaliar pessoa, família, comunidade, ciclo de vida, riscos, determinantes sociais, prevenção, longitudinalidade e coordenação do cuidado.',
    tratamento: 'Aplicar cuidado integral, promoção da saúde, manejo de condições comuns, prevenção, plano compartilhado e acompanhamento contínuo.',
    encaminhamento: 'Encaminhar quando houver urgência, complexidade, falha de manejo, necessidade diagnóstica especializada ou vulnerabilidade social grave.',
    seguranca: 'Evitar fragmentação; registrar plano, retorno, sinais de alarme e responsabilidade compartilhada.'
  },
  {
    nome: 'Emergência',
    fonte: 'AHA Guidelines; Manchester Triage; ATLS/PHTLS quando aplicável; Ministério da Saúde urgência e emergência',
    avaliacao: 'Avaliar ABCDE, sinais vitais, nível de consciência, dor, risco imediato, mecanismo de trauma e critérios de prioridade.',
    tratamento: 'Executar suporte inicial, estabilização, classificação de risco, medidas de segurança e acionamento de rede de urgência.',
    encaminhamento: 'Encaminhar/acionar SAMU/serviço de emergência em dor torácica, AVC, dispneia, trauma, anafilaxia, sepse, convulsão ou rebaixamento.',
    seguranca: 'Não atrasar atendimento de urgência; registrar horário, sinais, condutas e transferência responsável.'
  }
];

const bibliotecasMedicinasTradicionais = {
  Fitoterapia: [
    {
      nome: 'Fitoterapia - Biblioteca validada de plantas medicinais',
      descricao: 'Fontes-base: PNPIC/MS; Política e Programa Nacional de Plantas Medicinais e Fitoterápicos; RENISUS; ANVISA; WHO Monographs on Selected Medicinal Plants. Usar para seleção segura, uso racional, rastreio de interações e sustentabilidade da biodiversidade.',
      fonte: 'Ministério da Saúde/PNPIC; Programa Nacional de Plantas Medicinais e Fitoterápicos; ANVISA; OMS/WHO Monographs'
    }
  ],
  Ayurveda: [
    {
      nome: 'Ayurveda - Biblioteca validada por diretrizes internacionais',
      descricao: 'Fontes-base: WHO Benchmarks for Training in Ayurveda; WHO Global Traditional Medicine Strategy 2025-2034; Ministry of AYUSH. Usar como referência de formação, escopo, segurança, avaliação individualizada e integração responsável ao cuidado em saúde.',
      fonte: 'WHO Benchmarks for Training in Ayurveda; WHO Global Traditional Medicine Strategy 2025-2034; Ministry of AYUSH'
    }
  ],
  MTC: [
    {
      nome: 'MTC - Biblioteca validada de Medicina Tradicional Chinesa',
      descricao: 'Fontes-base: WHO Benchmarks for Training in Traditional Chinese Medicine; PNPIC/MS; Portaria MS nº 971/2006. Incluir acupuntura, práticas corporais, práticas mentais, orientação alimentar e fitoterapia tradicional chinesa dentro do escopo habilitado.',
      fonte: 'WHO Benchmarks for Training in Traditional Chinese Medicine; PNPIC/MS; Portaria MS nº 971/2006'
    }
  ],
  Acupuntura: [
    {
      nome: 'Acupuntura - Biblioteca validada de formação e biossegurança',
      descricao: 'Fontes-base: WHO Benchmarks for Training in Acupuncture; PNPIC/MS; Portaria MS nº 971/2006. Priorizar triagem de contraindicações, consentimento, técnica asséptica, agulhas descartáveis e encaminhamento em sinais de alarme.',
      fonte: 'WHO Benchmarks for Training in Acupuncture; PNPIC/MS; Portaria MS nº 971/2006'
    }
  ],
  'Medicina Tradicional': [
    {
      nome: 'Medicina Tradicional - Estratégia global e integração segura',
      descricao: 'Fontes-base: WHO Global Traditional Medicine Strategy 2025-2034; WHO Traditional, Complementary and Integrative Medicine; PNPIC/MS. Usar como referência para evidência, segurança, regulação, respeito cultural, proteção de saberes tradicionais e integração ao sistema de saúde.',
      fonte: 'WHO Global Traditional Medicine Strategy 2025-2034; WHO TCIM; PNPIC/MS'
    }
  ]
};

function montarItens(e) {
  const itens = [
    [e.nome, 'fonte', `${e.nome} - Fontes confiáveis`, e.fonte, 'Usar como referência inicial; confirmar diretrizes atualizadas antes da conduta.'],
    [e.nome, 'protocolo', `${e.nome} - Protocolo de avaliação`, e.avaliacao, e.fonte],
    [e.nome, 'tratamento', `${e.nome} - Tratamentos/intervenções disponíveis`, e.tratamento, e.fonte],
    [e.nome, 'encaminhamento', `${e.nome} - Encaminhamentos e sinais de alerta`, e.encaminhamento, e.fonte],
    [e.nome, 'seguranca', `${e.nome} - Segurança, limites e contraindicações`, e.seguranca, e.fonte]
  ];
  const bibliotecasExtras = bibliotecasMedicinasTradicionais[e.nome] || [];
  bibliotecasExtras.forEach((item) => {
    itens.push([e.nome, 'biblioteca', item.nome, item.descricao, item.fonte]);
  });
  return itens;
}

async function popular() {
  console.log('🚀 Populando protocolos, fontes e encaminhamentos por especialidade...\n');
  const client = await db.connect();

  try {
    const res = await client.query('SELECT id, nome FROM especialidades');
    const espec = {};
    res.rows.forEach(e => { espec[e.nome] = e.id; });

    let inseridos = 0;
    let ignorados = 0;

    for (const especialidade of especialidades) {
      const especialidadeId = espec[especialidade.nome];
      if (!especialidadeId) {
        console.warn(`⚠️ Especialidade não encontrada: ${especialidade.nome}`);
        continue;
      }

      for (const item of montarItens(especialidade)) {
        const [, tipo, nome, descricao, fonte] = item;
        const result = await client.query(
          `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
           SELECT $1, $2, $3, $4, $5, NULL
           WHERE NOT EXISTS (
             SELECT 1 FROM banco_terapeutico
             WHERE especialidade_id = $1 AND tipo = $2 AND nome = $3
           )`,
          [especialidadeId, tipo, nome, descricao, fonte]
        );

        if (result.rowCount) inseridos++;
        else ignorados++;
      }
    }

    console.log(`✅ Protocolos inseridos: ${inseridos}`);
    console.log(`ℹ️ Já existentes/ignorados: ${ignorados}`);
  } finally {
    client.release();
    await db.end();
  }
}

popular().catch((e) => {
  console.error('❌ Erro ao popular protocolos por especialidade:', e);
  process.exit(1);
});
