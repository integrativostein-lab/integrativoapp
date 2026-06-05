const axios = require('axios');
const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function configurarCompleto() {
  console.log('🔧 Configurando profissional demo completo...\n');

  // Login
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'profissional@demo.com', senha: 'demo123'
  });
  const token = login.data.token;
  const id = login.data.usuario.id;
  console.log('✅ Logado. ID:', id);

  // 1. VALORES (já feito)
  console.log('\n💰 Configurando valores...');
  for (let esp = 1; esp <= 5; esp++) {
    try {
      await axios.post(`${API_URL}/profissionais/valores`, {
        especialidade_id: esp,
        valor_online: 150 + (esp * 10),
        valor_presencial: 200 + (esp * 10)
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      console.log(`✅ Especialidade ${esp}: Online R$${150+esp*10} / Presencial R$${200+esp*10}`);
    } catch (e) {
      console.log(`⚠️ Especialidade ${esp}:`, e.response?.data?.erro || 'OK');
    }
  }

  // 2. LOJA - Produtos de demonstração
  console.log('\n🛒 Criando produtos na loja...');
  const produtos = [
    { nome: 'Óleo Essencial de Lavanda', preco: 45.00, estoque: 20, categoria: 'Aromaterapia' },
    { nome: 'Tapete de Yoga Premium', preco: 89.90, estoque: 15, categoria: 'Yoga' },
    { nome: 'Kit de Ervas Medicinais', preco: 65.00, estoque: 10, categoria: 'Fitoterapia' },
    { nome: 'E-book: Guia de Meditação', preco: 19.90, estoque: 999, categoria: 'Digital' }
  ];

  for (const prod of produtos) {
    try {
      await axios.post(`${API_URL}/loja/produtos`, prod, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Produto: ${prod.nome} — R$ ${prod.preco}`);
    } catch (e) {
      console.log(`⚠️ ${prod.nome}:`, e.response?.data?.erro || 'OK');
    }
  }

  // 3. PLANO DE YOGA DEMO
  console.log('\n🧘 Criando plano de Yoga demo...');
  try {
    await axios.post(`${API_URL}/yoga/planos`, {
      nome_plano: 'Plano Básico - 8 aulas/mês',
      aulas_por_mes: 8,
      valor_online: 120.00,
      valor_presencial: 160.00
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Plano de Yoga criado!');
  } catch (e) {
    console.log('⚠️ Yoga:', e.response?.data?.erro || 'OK');
  }

  // 4. PLANO DE MASSAGEM DEMO
  console.log('\n💆 Criando plano de Massagem demo...');
  try {
    await axios.post(`${API_URL}/massagens/planos`, {
      nome_plano: 'Pacote 5 Sessões',
      sessoes_por_mes: 5,
      valor_online: 0,
      valor_presencial: 250.00
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Plano de Massagem criado!');
  } catch (e) {
    console.log('⚠️ Massagem:', e.response?.data?.erro || 'OK');
  }

  // 5. ARTIGO NO BLOG DEMO
  console.log('\n✍️ Criando artigo no blog...');
  try {
    await axios.post(`${API_URL}/blog`, {
      titulo: '5 Plantas Medicinais para Ansiedade — Guia Completo 2026',
      conteudo: 'A ansiedade é um dos problemas mais comuns da vida moderna. Neste artigo, exploramos 5 plantas medicinais com eficácia comprovada...',
      publicado: 1
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('✅ Artigo publicado!');
  } catch (e) {
    console.log('⚠️ Blog:', e.response?.data?.erro || 'OK');
  }

  console.log('\n🎉 Profissional demo configurado com sucesso!');
  console.log('📱 Acesse: https://integra-saude-psi.vercel.app');
  console.log('👨‍⚕️ profissional@demo.com / demo123');
}

configurarCompleto();