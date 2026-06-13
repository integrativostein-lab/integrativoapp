const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function inserirValores() {
  console.log('🔧 Configurando profissional demo via admin...\n');

  // Login como admin
  const loginAdmin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@integra.com', senha: 'admin123'
  });
  const tokenAdmin = loginAdmin.data.token;
  console.log('✅ Admin logado');

  // Login como profissional para obter token
  const loginProf = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com', senha: 'demo123'
  });
  const tokenProf = loginProf.data.token;

  // Atualizar bibliotecas e perfil do profissional via rotas de usuários
  try {
    await axios.put(`${API_URL}/usuarios/bibliotecas`, {
      bibliotecas: ['Fitoterapia', 'Ayurveda', 'MTC', 'Yoga']
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    await axios.put(`${API_URL}/usuarios/perfil`, {
      atende_online: 1,
      atende_presencial: 1
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    console.log('✅ Perfil atualizado: especialidades, modalidades, plano Enterprise');
  } catch (e) {
    console.log('⚠️ Atualização perfil:', e.response?.data?.erro || e.message);
  }

  // Agora tenta criar agendamento
  try {
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const r = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: 26,
      data_agendamento: amanha,
      horario_inicio: '09:00',
      modalidade: 'online'
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    console.log('✅ Agendamento criado! ID:', r.data.id);
  } catch (e) {
    console.log('❌ Agendamento:', e.response?.data?.erro || e.message);
  }

  console.log('\n🎉 Concluído! Acesse o painel e veja se aparece.');
}

inserirValores();