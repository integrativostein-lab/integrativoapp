const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function inserirDireto() {
  console.log('🔧 Última tentativa...\n');

  // Login como profissional
  const loginProf = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com', senha: 'demo123'
  });
  const tokenProf = loginProf.data.token;
  console.log('✅ Profissional logado');

  // Tentar criar agendamento com valor=0 (ignorando tabela de valores)
  try {
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const r = await axios.post(`${API_URL}/agendamentos`, {
      paciente_id: 27, // ID do paciente demo
      profissional_id: 26, // ID do profissional demo
      data_agendamento: amanha,
      horario_inicio: '09:00',
      horario_fim: '10:00',
      modalidade: 'online',
      valor: 150.00,
      status: 'agendado'
    }, { headers: { 'Authorization': `Bearer ${tokenProf}` } });
    console.log('✅ Agendamento criado! ID:', r.data.id);
  } catch (e) {
    console.log('❌ Erro:', e.response?.data?.erro || e.message);
  }
}

inserirDireto();