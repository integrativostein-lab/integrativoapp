const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function inserirValoresSQL() {
  console.log('🔧 Inserindo valores via SQL...\n');

  // Login como admin
  const loginAdmin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@integra.com', senha: 'admin123'
  });
  const tokenAdmin = loginAdmin.data.token;
  console.log('✅ Admin logado');

  // Login como profissional
  const loginProf = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com', senha: 'demo123'
  });
  const tokenProf = loginProf.data.token;
  console.log('✅ Profissional logado');

  // Tentar criar valor via PUT na rota de perfil (forçando)
  try {
    await axios.put(`${API_URL}/usuarios/perfil`, {
      especialidades: JSON.stringify(['Fitoterapia']),
      atende_online: 1,
      atende_presencial: 1
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    console.log('✅ Especialidades atualizadas');
  } catch (e) {
    console.log('⚠️:', e.response?.data?.erro || e.message);
  }

  // Tentar agendamento com a rota correta (passando valor diretamente)
  try {
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Tentativa 1: POST normal
    const r = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: 26,
      especialidade_id: 1,
      data_agendamento: amanha,
      horario_inicio: '09:00',
      modalidade: 'online',
      valor: 150.00
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    console.log('✅ Agendamento criado! ID:', r.data.id);
  } catch (e) {
    console.log('❌ Erro:', e.response?.data?.erro || e.message);
    
    // Verificar o que a rota de agendamento espera
    console.log('\n📋 Verificando estrutura da rota...');
    try {
      const teste = await axios.get(`${API_URL}/agendamentos/meus`, {
        headers: { 'Authorization': `Bearer ${tokenProf}` }
      });
      console.log('✅ Rota de agendamentos funciona. Agendamentos existentes:', teste.data.length);
    } catch (e2) {
      console.log('⚠️ Rota /agendamentos/meus:', e2.response?.data?.erro || e2.message);
    }
  }

  console.log('\n🎉 Concluído!');
}

inserirValoresSQL();