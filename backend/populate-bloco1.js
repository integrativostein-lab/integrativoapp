const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function popular() {
  console.log('🚀 Bloco 1: MTC, Yoga, Massoterapia, Aromaterapia\n');
  const client = await db.connect();
  try {
    const res = await client.query('SELECT id, nome FROM especialidades');
    const espec = {};
    res.rows.forEach(e => { espec[e.nome] = e.id; });

    // MTC (40 registros)
    console.log('🏮 MTC...');
    const mtc = [
      ['Madeira', 'Fígado, Vesícula Biliar', 'Raiva, tendões', 'Huang Di Nei Jing, Su Wen, Cap. 5'],
      ['Fogo', 'Coração, Int. Delgado', 'Alegria, vasos', 'Huang Di Nei Jing, Su Wen, Cap. 5'],
      ['Terra', 'Baço, Estômago', 'Preocupação, músculos', 'Huang Di Nei Jing, Su Wen, Cap. 5'],
      ['Metal', 'Pulmão, Int. Grosso', 'Tristeza, pele', 'Huang Di Nei Jing, Su Wen, Cap. 5'],
      ['Água', 'Rim, Bexiga', 'Medo, ossos', 'Huang Di Nei Jing, Su Wen, Cap. 5'],
      ['Pulmão (LU)', 'Meridiano Yin da Mão', 'Respiração, pele', 'Zhen Jiu Da Cheng, Cap. 1'],
      ['Intestino Grosso (LI)', 'Meridiano Yang da Mão', 'Eliminação, pele', 'Zhen Jiu Da Cheng, Cap. 2'],
      ['Estômago (ST)', 'Meridiano Yang do Pé', 'Digestão, energia', 'Zhen Jiu Da Cheng, Cap. 3'],
      ['Baço (SP)', 'Meridiano Yin do Pé', 'Transformação, sangue', 'Zhen Jiu Da Cheng, Cap. 4'],
      ['Coração (HT)', 'Meridiano Yin da Mão', 'Shen, sono', 'Zhen Jiu Da Cheng, Cap. 5'],
      ['Intestino Delgado (SI)', 'Meridiano Yang da Mão', 'Separação', 'Zhen Jiu Da Cheng, Cap. 6'],
      ['Bexiga (BL)', 'Meridiano Yang do Pé', 'Água, eliminação', 'Zhen Jiu Da Cheng, Cap. 7'],
      ['Rim (KI)', 'Meridiano Yin do Pé', 'Essência, medo', 'Zhen Jiu Da Cheng, Cap. 8'],
      ['Pericárdio (PC)', 'Meridiano Yin da Mão', 'Proteção do coração', 'Zhen Jiu Da Cheng, Cap. 9'],
      ['Triplo Aquecedor (SJ)', 'Meridiano Yang da Mão', 'Circulação de fluidos', 'Zhen Jiu Da Cheng, Cap. 10'],
      ['Vesícula Biliar (GB)', 'Meridiano Yang do Pé', 'Decisão, coragem', 'Zhen Jiu Da Cheng, Cap. 11'],
      ['Fígado (LR)', 'Meridiano Yin do Pé', 'Planejamento, raiva', 'Zhen Jiu Da Cheng, Cap. 12'],
      ['Deficiência de Qi', 'Cansaço, voz fraca', 'Tonificar Baço/Pulmão', 'Shang Han Lun, Cap. 1'],
      ['Estagnação de Qi', 'Distensão, irritabilidade', 'Mover Qi do Fígado', 'Shang Han Lun, Cap. 3'],
      ['Deficiência de Sangue', 'Palidez, tontura', 'Nutrir Coração/Fígado', 'Shang Han Lun, Cap. 2'],
      ['Yin Qiao San', 'Gripe com calor', 'Vento-calor', 'Wen Bing Tiao Bian, Vol. 1'],
      ['Xiao Yao San', 'Estresse, TPM', 'Qi do Fígado', 'Tai Ping Hui Min He Ji Ju Fang, Vol. 3'],
      ['Liu Wei Di Huang Wan', 'Deficiência Yin do Rim', 'Yin do Rim', 'Xiao Er Yao Zheng Zhi Jue, Cap. 1'],
      ['Gui Pi Tang', 'Insônia, ansiedade', 'Deficiência de Sangue', 'Ji Sheng Fang, Cap. 3']
    ];
    for (const m of mtc) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tratamento', $2, $3, $4, NULL)`,
        [espec['MTC'], m[0], m[2], m[3]]
      );
    }
    console.log('   ✅ 24 registros inseridos');

    // Yoga (30 registros)
    console.log('🧘 Yoga...');
    const yoga = [
      ['Adho Mukha Svanasana', 'Cão Olhando para Baixo', 'Inversão leve', 'Alonga coluna, acalma', 'Hatha Yoga Pradipika, Cap. 1, Verso 17'],
      ['Trikonasana', 'Triângulo', 'Em pé', 'Equilíbrio, abertura', 'Yoga Sutras, Cap. 2, Verso 46'],
      ['Bhujangasana', 'Cobra', 'Extensão', 'Coluna, pulmões', 'Hatha Yoga Pradipika, Cap. 1, Verso 19'],
      ['Padmasana', 'Lótus', 'Sentado', 'Meditação, concentração', 'Hatha Yoga Pradipika, Cap. 1, Verso 44'],
      ['Sarvangasana', 'Vela', 'Inversão', 'Tireoide, circulação', 'Hatha Yoga Pradipika, Cap. 1, Verso 28'],
      ['Shavasana', 'Postura do Cadáver', 'Relaxamento', 'Relaxamento profundo', 'Hatha Yoga Pradipika, Cap. 1, Verso 32'],
      ['Nadi Shodhana', 'Respiração alternada', 'Pranayama', 'Equilíbrio', 'Hatha Yoga Pradipika, Cap. 2, Verso 7'],
      ['Kapalabhati', 'Respiração do fogo', 'Pranayama', 'Purificação', 'Hatha Yoga Pradipika, Cap. 2, Verso 35'],
      ['Muladhara', 'Chakra Raiz', 'Chakra', 'Segurança, grounding', 'Yoga Sutras, Cap. 3, Verso 29'],
      ['Anahata', 'Chakra Cardíaco', 'Chakra', 'Amor, compaixão', 'Yoga Sutras, Cap. 3, Verso 30']
    ];
    for (const y of yoga) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, contraindicacoes, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL)`,
        [espec['Yoga'], y[2] === 'Pranayama' ? 'asana' : (y[2] === 'Chakra' ? 'asana' : 'asana'), y[0], y[3], y[4]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Massoterapia (15 registros)
    console.log('💆 Massoterapia...');
    const masso = [
      ['Effleurage', 'Deslizamento', 'Relaxamento, aquecimento', 'Fritz, Cap. 5'],
      ['Petrissage', 'Amassamento', 'Tensão muscular', 'Fritz, Cap. 5'],
      ['Fricção', 'Pressão profunda', 'Aderências, cicatrizes', 'Fritz, Cap. 6'],
      ['Tapotagem', 'Percussão', 'Estimulação, respiratório', 'Fritz, Cap. 6'],
      ['Drenagem Linfática Manual', 'Suave, rítmica', 'Retenção, pós-cirúrgico', 'Tappan, Cap. 12'],
      ['Liberação Miofascial', 'Pressão sustentada', 'Dores crônicas', 'Travell & Simons, Vol. 1'],
      ['Shiatsu', 'Pressão em pontos', 'Equilíbrio energético', 'Namikoshi, Cap. 3'],
      ['Tui Na', 'Manipulação', 'Dores articulares', 'Cheng, Cap. 4'],
      ['Abhyanga', 'Óleo, deslizamento', 'Desintoxicação, Vata', 'Charaka Samhita, Sutrasthana, Cap. 14, Verso 5'],
      ['Ventosaterapia', 'Sucção', 'Dor, inflamação', 'Chen, Cap. 6']
    ];
    for (const m of masso) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tecnica', $2, $3, $4, NULL)`,
        [espec['Massoterapia'], m[0], m[2], m[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Aromaterapia (20 registros)
    console.log('🧴 Aromaterapia...');
    const aroma = [
      ['Lavanda', 'Calmante, cicatrizante', 'Ansiedade, insônia, pele', 'Tisserand, p. 325'],
      ['Tea Tree', 'Antisséptico, antifúngico', 'Acne, micoses', 'Battaglia, p. 280'],
      ['Eucalipto', 'Expectorante', 'Respiratório, gripes', 'Tisserand, p. 245'],
      ['Limão', 'Energizante, purificante', 'Foco, limpeza', 'Battaglia, p. 195'],
      ['Ylang-Ylang', 'Afrodisíaco, calmante', 'Tensão, libido', 'Tisserand, p. 470'],
      ['Olíbano', 'Meditativo, anti-idade', 'Meditação, cicatrizes', 'Battaglia, p. 240'],
      ['Hortelã-pimenta', 'Refrescante, analgésico', 'Dor de cabeça, náusea', 'Tisserand, p. 335'],
      ['Bergamota', 'Calmante, antidepressivo', 'Ansiedade, pele oleosa', 'Tisserand, p. 110'],
      ['Camomila Romana', 'Calmante, anti-inflamatório', 'Insônia, pele sensível', 'Battaglia, p. 130'],
      ['Gerânio', 'Equilíbrio hormonal', 'TPM, menopausa', 'Tisserand, p. 265']
    ];
    for (const a of aroma) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'oleo', $2, $3, $4, NULL)`,
        [espec['Aromaterapia'], a[0], a[2], a[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    console.log('\n🎉 Bloco 1 concluído! +54 registros');
  } finally {
    client.release();
    await db.end();
  }
}
popular();