const axios = require('axios');

const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function criarAgendamentosDemo() {
  console.log('📅 Criando agendamentos simulados...\n');

  // Primeiro, fazer login para obter os tokens
  let tokenProfissional, tokenPaciente, idProfissional, idPaciente;

  try {
    const loginProf = await axios.post(`${API_URL}/auth/login`, {
      email: 'profissional@demo.com',
      senha: 'demo123'
    });
    tokenProfissional = loginProf.data.token;
    idProfissional = loginProf.data.usuario.id;
    console.log('✅ Login profissional OK. ID:', idProfissional);
  } catch (e) {
    console.log('❌ Erro ao logar como profissional. As contas demo já foram criadas?');
    return;
  }

  try {
    const loginPac = await axios.post(`${API_URL}/auth/login`, {
      email: 'paciente@demo.com',
      senha: 'demo123'
    });
    tokenPaciente = loginPac.data.token;
    idPaciente = loginPac.data.usuario.id;
    console.log('✅ Login paciente OK. ID:', idPaciente);
  } catch (e) {
    console.log('❌ Erro ao logar como paciente. As contas demo já foram criadas?');
    return;
  }

  // Datas para os agendamentos
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dataAmanha = amanha.toISOString().split('T')[0];

  const proximaSemana = new Date();
  proximaSemana.setDate(proximaSemana.getDate() + 7);
  const dataProximaSemana = proximaSemana.toISOString().split('T')[0];

  const mesPassado = new Date();
  mesPassado.setDate(mesPassado.getDate() - 15);
  const dataMesPassado = mesPassado.toISOString().split('T')[0];

  // Agendamento 1: Online para amanhã
  try {
    const r1 = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: idProfissional,
      data_agendamento: dataAmanha,
      horario_inicio: '09:00',
      modalidade: 'online'
    }, { headers: { 'Authorization': `Bearer ${tokenPaciente}` } });
    console.log('✅ Agendamento 1 criado: Amanhã 09:00 — Online (ID:', r1.data.id, ')');
  } catch (e) {
    console.log('⚠️ Agendamento 1:', e.response ? e.response.data.erro : e.message);
  }

  // Agendamento 2: Presencial para próxima semana
  try {
    const r2 = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: idProfissional,
      data_agendamento: dataProximaSemana,
      horario_inicio: '14:00',
      modalidade: 'presencial'
    }, { headers: { 'Authorization': `Bearer ${tokenPaciente}` } });
    console.log('✅ Agendamento 2 criado:', dataProximaSemana, '14:00 — Presencial (ID:', r2.data.id, ')');
  } catch (e) {
    console.log('⚠️ Agendamento 2:', e.response ? e.response.data.erro : e.message);
  }

  // Agendamento 3: Online já realizado (mês passado)
  try {
    const r3 = await axios.post(`${API_URL}/agendamentos`, {
      profissional_id: idProfissional,
      data_agendamento: dataMesPassado,
      horario_inicio: '10:00',
      modalidade: 'online'
    }, { headers: { 'Authorization': `Bearer ${tokenPaciente}` } });
    
    // Marcar como realizado
    await axios.put(`${API_URL}/agendamentos/${r3.data.id}/checkin`, {}, {
      headers: { 'Authorization': `Bearer ${tokenProfissional}` }
    });
    console.log('✅ Agendamento 3 criado:', dataMesPassado, '10:00 — Online (REALIZADO)');
  } catch (e) {
    console.log('⚠️ Agendamento 3:', e.response ? e.response.data.erro : e.message);
  }

  console.log('\n🎉 Agendamentos demo prontos!');
  console.log('📱 Acesse: https://integra-saude-psi.vercel.app');
  console.log('👨‍⚕️ Profissional: profissional@demo.com / demo123');
  console.log('👩‍🦰 Paciente: paciente@demo.com / demo123');
}

criarAgendamentosDemo();