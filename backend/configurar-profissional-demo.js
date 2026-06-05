const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function configurar() {
  console.log('🔧 Configurando profissional demo...\n');

  // Login
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com',
    senha: 'demo123'
  });
  
  const token = login.data.token;
  const id = login.data.usuario.id;
  console.log('✅ Logado. ID:', id, '\n');

  // Tentar rota de valores
  try {
    await axios.post(`${API_URL}/profissionais/valores`, {
      especialidade_id: 1,
      valor_online: 150.00,
      valor_presencial: 200.00
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Valores configurados via /profissionais/valores');
  } catch (e) {
    console.log('⚠️ Rota /profissionais/valores falhou:', e.response?.data?.erro || e.message);
  }

  // Tentar rota alternativa (usuarios/perfil)
  try {
    await axios.put(`${API_URL}/usuarios/perfil`, {
      especialidades: JSON.stringify(['Fitoterapia']),
      atende_online: 1,
      atende_presencial: 1
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Perfil atualizado com especialidades');
  } catch (e) {
    console.log('⚠️ Atualização de perfil:', e.response?.data?.erro || e.message);
  }

  // Criar agendamento de teste com valor zero (ignora valores do profissional)
  try {
    const r = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: id,
      data_agendamento: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      horario_inicio: '09:00',
      modalidade: 'online',
      valor: 150.00
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Agendamento de teste criado! ID:', r.data.id);
  } catch (e) {
    console.log('❌ Agendamento:', e.response?.data?.erro || e.message);
  }

  console.log('\n🎉 Pronto!');
}

configurar();