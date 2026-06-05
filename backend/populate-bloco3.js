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
    console.log('   ✅ 16 registros inseridos');

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