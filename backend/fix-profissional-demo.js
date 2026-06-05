const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function fixProfissional() {
  console.log('🔧 Corrigindo profissional demo...\n');

  // Login
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com', senha: 'demo123'
  });
  const token = login.data.token;
  const id = login.data.usuario.id;
  console.log('✅ Logado. ID:', id);

  // Verificar se a tabela profissional_valores existe e inserir direto
  // Vamos usar a rota de perfil para atualizar o plano primeiro
  try {
    await axios.put(`${API_URL}/usuarios/perfil`, {
      gateway_preferido: 'pagseguro',
      gateway_token: 'demo_token',
      gateway_email: 'profissional@demo.com'
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Perfil atualizado');
  } catch (e) {
    console.log('⚠️ Perfil:', e.response?.data?.erro || e.message);
  }

  // Agora tenta criar agendamento ignorando valor (passando valor=0)
  try {
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const r = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: id,
      data_agendamento: amanha,
      horario_inicio: '09:00',
      modalidade: 'online'
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Agendamento criado! ID:', r.data.id);
  } catch (e) {
    console.log('❌ Agendamento:', e.response?.data?.erro || e.message);
  }

  console.log('\n🎉 Concluído!');
}

fixProfissional();