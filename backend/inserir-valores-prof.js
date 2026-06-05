const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function inserirValoresProf() {
  console.log('🔧 Inserindo valores como profissional...\n');

  // Login como PROFISSIONAL (não admin)
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com',
    senha: 'demo123'
  });
  const token = login.data.token;
  const id = login.data.usuario.id;
  console.log('✅ Logado como profissional. ID:', id);

  // Inserir valores
  try {
    await axios.post(`${API_URL}/profissionais/valores`, {
      especialidade_id: 1,
      valor_online: 150.00,
      valor_presencial: 200.00
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Valores inseridos!');
  } catch (e) {
    console.log('❌ Erro:', e.response?.data?.erro || e.message);
  }

  console.log('\n🎉 Pronto! Agora execute: node criar-agendamentos-demo.js');
}

inserirValoresProf();