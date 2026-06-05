const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function inserirValores() {
  console.log('🔧 Inserindo valores para o profissional demo...\n');

  // Login como admin (super_admin tem mais poderes)
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@integra.com',
    senha: 'admin123'
  });
  const token = login.data.token;
  console.log('✅ Logado como admin');

  // Agora faz login como profissional para pegar o ID
  const loginProf = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com',
    senha: 'demo123'
  });
  const idProfissional = loginProf.data.usuario.id;
  console.log('✅ ID do profissional:', idProfissional);

  // Tentar criar valor via POST na rota correta
  try {
    await axios.post(`${API_URL}/profissionais/valores`, {
      especialidade_id: 1,
      valor_online: 150.00,
      valor_presencial: 200.00,
      duracao_minutos: 60
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Valores inseridos com sucesso!');
  } catch (e) {
    console.log('❌ Erro ao inserir valores:', e.response?.data || e.message);
    console.log('Status:', e.response?.status);
    console.log('URL tentada:', `${API_URL}/profissionais/valores`);
  }

  // Verificar se os valores foram salvos
  try {
    const verifica = await axios.get(`${API_URL}/usuarios/perfil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Perfil do profissional:', JSON.stringify(verifica.data.valores || 'sem valores'));
  } catch (e) {
    console.log('⚠️ Verificação:', e.message);
  }
}

inserirValores();