const axios = require('axios');

const API_URL = 'https://integra-backend-ynrd.onrender.com/api';

async function criarContasDemo() {
  console.log('🚀 Criando contas demo...\n');

  const profissional = {
    nome: 'Dr. João Integrativo',
    email: 'profissional@demo.com',
    senha: 'demo123',
    tipo: 'profissional',
    especialidades: JSON.stringify([
      'Fitoterapia','Ayurveda','MTC','Yoga','Massoterapia','Aromaterapia',
      'Fisioterapia','Xamanismo','Florais de Bach','Terapia de Florais','Reiki','Reflexologia',
      'Medicina Integrativa','Jyotish','Vastu Shastra','Quiropraxia',
      'Osteopatia','Cromoterapia','Musicoterapia','Equoterapia','Apiterapia',
      'Arteterapia','Biodança','Bioenergética','Constelação Familiar',
      'Dança Circular','Geoterapia','Hipnoterapia','Homeopatia',
      'Imposição de Mãos','Medicina Antroposófica','Meditação','Naturopatia',
      'Ozonioterapia','Shantala','Terapia Comunitária Integrativa',
      'Termalismo Social / Crenoterapia',
      'Hidroterapia','Acupuntura','Medicina Tradicional','Farmacologia',
      'Pediatria','Ginecologia','Geriatria','Saúde Mental',
      'Medicina de Família','Emergência'
    ]),
    atende_online: 1,
    atende_presencial: 1,
    lgpd_consentimento: 1
  };

  const paciente = {
    nome: 'Maria Paciente',
    email: 'paciente@demo.com',
    senha: 'demo123',
    tipo: 'paciente',
    lgpd_consentimento: 1
  };

  try {
    const r1 = await axios.post(`${API_URL}/auth/cadastro`, profissional);
    console.log('✅ Profissional: profissional@demo.com / demo123');
  } catch (e) {
    if (e.response && e.response.data && e.response.data.erro === 'Email já cadastrado') {
      await axios.post(`${API_URL}/auth/login`, { email: 'profissional@demo.com', senha: 'demo123' });
      console.log('⚠️ Profissional já existia. Login OK.');
    }
  }

  try {
    const r2 = await axios.post(`${API_URL}/auth/cadastro`, paciente);
    console.log('✅ Paciente: paciente@demo.com / demo123');
  } catch (e) {
    if (e.response && e.response.data && e.response.data.erro === 'Email já cadastrado') {
      await axios.post(`${API_URL}/auth/login`, { email: 'paciente@demo.com', senha: 'demo123' });
      console.log('⚠️ Paciente já existia. Login OK.');
    }
  }

  console.log('\n🎉 Pronto! Acesse: https://integra-saude-psi.vercel.app');
}

criarContasDemo();