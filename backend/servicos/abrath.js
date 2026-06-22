const axios = require('axios');
const ambiente = require('../config/ambiente');

async function verificarRegistroABRATH(registro, nome) {
  if (!registro) return false;

  try {
    const response = await axios.get(`https://abrath.org.br/consulta?registro=${encodeURIComponent(registro)}`, {
      timeout: 10000
    });

    if (response.data && nome && String(response.data).includes(nome)) {
      return true;
    }

    if (response.status === 200 && response.data) {
      return String(response.data).toLowerCase().includes(String(registro).toLowerCase());
    }

    return false;
  } catch (erro) {
    if (ambiente.modoTeste) {
      console.log('⚠️ ABRATH indisponível em modo teste — validação dispensada.');
      return true;
    }
    console.warn('⚠️ Não foi possível verificar o registro ABRATH online:', erro.message);
    return false;
  }
}

module.exports = { verificarRegistroABRATH };
