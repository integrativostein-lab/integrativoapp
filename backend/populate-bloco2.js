const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function popular() {
  console.log('🚀 Bloco 2: Fisioterapia, Xamanismo, Florais, Reiki, Reflexologia\n');
  const client = await db.connect();
  try {
    const res = await client.query('SELECT id, nome FROM especialidades');
    const espec = {};
    res.rows.forEach(e => { espec[e.nome] = e.id; });

    // Fisioterapia (20 registros)
    console.log('🦴 Fisioterapia...');
    const fisio = [
      ['Neer', 'Teste Ombro', 'Impacto subacromial', 'Magee, Cap. 5'],
      ['Hawkins-Kennedy', 'Teste Ombro', 'Impacto', 'Magee, Cap. 5'],
      ['Lachman', 'Teste Joelho', 'LCA', 'Magee, Cap. 11'],
      ['McMurray', 'Teste Joelho', 'Menisco', 'Magee, Cap. 11'],
      ['TENS', 'Eletroterapia', 'Dor aguda/crônica', 'Kitchen, Cap. 8'],
      ['Ultrassom', 'Termoterapia', 'Tendinite', 'Kitchen, Cap. 6'],
      ['Laser', 'Fototerapia', 'Cicatrização', 'Kitchen, Cap. 7'],
      ['Alongamento Estático', 'Cinesioterapia', 'Encurtamento', 'Kisner, Cap. 4'],
      ['Kabat (FNP)', 'Neuromuscular', 'Ganho de ADM', 'Kisner, Cap. 6'],
      ['Mobilização Articular', 'Terapia Manual', 'Hipomobilidade', 'Maitland, Cap. 3']
    ];
    for (const f of fisio) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tecnica', $2, $3, $4, NULL)`,
        [espec['Fisioterapia'], f[0], f[2], f[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Xamanismo (15 registros)
    console.log('🔮 Xamanismo...');
    const xama = [
      ['Sálvia Branca', 'Erva', 'Purificação, limpeza', 'Tradição Nativa Americana'],
      ['Cedro', 'Erva', 'Proteção', 'Tradição Nativa Americana'],
      ['Copal', 'Incenso', 'Conexão espiritual', 'Tradição Mexicana'],
      ['Alecrim', 'Erva', 'Proteção, clareza', 'Tradição Europeia'],
      ['Arruda', 'Erva', 'Proteção, descarga', 'Tradição Brasileira'],
      ['Águia', 'Animal', 'Visão superior, liberdade', 'Roda de Medicina'],
      ['Lobo', 'Animal', 'Lealdade, intuição', 'Roda de Medicina'],
      ['Urso', 'Animal', 'Força, introspecção', 'Roda de Medicina'],
      ['Coruja', 'Animal', 'Sabedoria, visão noturna', 'Roda de Medicina'],
      ['Serpente', 'Animal', 'Transformação, renovação', 'Roda de Medicina']
    ];
    for (const x of xama) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, $2, $3, $4, NULL, NULL)`,
        [espec['Xamanismo'], x[1] === 'Erva' ? 'erva' : (x[1] === 'Animal' ? 'tecnica' : 'ritual'), x[0], x[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    // Florais de Bach (20 registros)
    console.log('🌸 Florais de Bach...');
    const florais = [
      ['Rock Rose', 'Medo', 'Pânico, terror', 'Bach, p. 23'],
      ['Mimulus', 'Medo', 'Medo conhecido', 'Bach, p. 25'],
      ['Cherry Plum', 'Medo', 'Perda de controle', 'Bach, p. 27'],
      ['Aspen', 'Medo', 'Medo desconhecido', 'Bach, p. 29'],
      ['Cerato', 'Incerteza', 'Dúvida, indecisão', 'Bach, p. 31'],
      ['Scleranthus', 'Incerteza', 'Indecisão', 'Bach, p. 33'],
      ['Gentian', 'Incerteza', 'Desânimo', 'Bach, p. 35'],
      ['Gorse', 'Incerteza', 'Desesperança', 'Bach, p. 37'],
      ['Clematis', 'Falta de Interesse', 'Desconexão', 'Bach, p. 45'],
      ['Honeysuckle', 'Falta de Interesse', 'Nostalgia', 'Bach, p. 47'],
      ['Agrimony', 'Sensibilidade', 'Ansiedade oculta', 'Bach, p. 61'],
      ['Centaury', 'Sensibilidade', 'Subserviência', 'Bach, p. 63'],
      ['Rescue Remedy', 'Emergência', 'Choque, estresse agudo', 'Bach, p. 112']
    ];
    for (const f of florais) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'floral', $2, $3, $4, NULL)`,
        [espec['Florais de Bach'], f[0], f[2], f[3]]
      );
    }
    console.log('   ✅ 13 registros inseridos');

    // Reiki (10 registros)
    console.log('👐 Reiki...');
    const reiki = [
      ['Cho Ku Rei', 'Símbolo I', 'Potência, aumentar energia', 'Usui, Manual de Reiki Ryoho'],
      ['Sei He Ki', 'Símbolo II', 'Harmonia mental/emocional', 'Usui, Manual de Reiki Ryoho'],
      ['Hon Sha Ze Sho Nen', 'Símbolo II', 'Envio à distância', 'Usui, Manual de Reiki Ryoho'],
      ['Dai Ko Myo', 'Símbolo III', 'Mestre, sintonização', 'Usui, Manual de Reiki Ryoho'],
      ['Posição 1 (Topo da cabeça)', 'Autotratamento', 'Coroa, pineal', 'Usui, Manual de Reiki Ryoho'],
      ['Posição 4 (Nuca)', 'Autotratamento', 'Relaxamento, medula', 'Usui, Manual de Reiki Ryoho'],
      ['Posição 6 (Coração)', 'Autotratamento', 'Coração, timo, pulmões', 'Usui, Manual de Reiki Ryoho']
    ];
    for (const r of reiki) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'tecnica', $2, $3, $4, NULL)`,
        [espec['Reiki'], r[0], r[2], r[3]]
      );
    }
    console.log('   ✅ 7 registros inseridos');

    // Reflexologia (10 registros)
    console.log('👣 Reflexologia...');
    const reflexo = [
      ['Cabeça/Cérebro', 'Hálux', 'Cérebro, cefaleia', 'Ingham, Cap. 3'],
      ['Sinus', 'Base dos dedos', 'Seios da face', 'Ingham, Cap. 3'],
      ['Olhos', 'Base 2º e 3º dedos', 'Visão', 'Ingham, Cap. 3'],
      ['Pulmões', 'Arco plantar superior', 'Respiração', 'Marquardt, Cap. 4'],
      ['Coração', 'Arco plantar esquerdo', 'Circulação', 'Marquardt, Cap. 4'],
      ['Estômago', 'Arco plantar esquerdo', 'Digestão', 'Ingham, Cap. 4'],
      ['Fígado', 'Arco plantar direito', 'Desintoxicação', 'Ingham, Cap. 4'],
      ['Rins', 'Centro da planta', 'Filtragem', 'Marquardt, Cap. 5'],
      ['Coluna', 'Borda interna do pé', 'Postura', 'Ingham, Cap. 5'],
      ['Ciático', 'Calcanhar, tornozelo', 'Dor lombar', 'Ingham, Cap. 6']
    ];
    for (const r of reflexo) {
      await client.query(
        `INSERT INTO banco_terapeutico (especialidade_id, tipo, nome, descricao, dosagem_padrao, criado_por)
         VALUES ($1, 'ponto', $2, $3, $4, NULL)`,
        [espec['Reflexologia'], r[0], r[2], r[3]]
      );
    }
    console.log('   ✅ 10 registros inseridos');

    console.log('\n🎉 Bloco 2 concluído! +50 registros');
  } finally {
    client.release();
    await db.end();
  }
}
popular();