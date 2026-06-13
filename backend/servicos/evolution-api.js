const axios = require('axios');

function config() {
  return {
    baseUrl: (process.env.EVOLUTION_API_URL || '').replace(/\/+$/, ''),
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instance: process.env.EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE_NAME || '',
    simulate: process.env.EVOLUTION_SIMULATE === 'true' || process.env.TEST_MODE === 'true'
  };
}

function configurado() {
  const c = config();
  return c.simulate || Boolean(c.baseUrl && c.apiKey && c.instance);
}

function normalizarTelefone(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '';
  if (digitos.startsWith('55')) return digitos;
  if (digitos.length >= 10 && digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

function cliente() {
  const c = config();
  return axios.create({
    baseURL: c.baseUrl,
    timeout: Number(process.env.EVOLUTION_TIMEOUT_MS || 15000),
    headers: {
      apikey: c.apiKey,
      'Content-Type': 'application/json'
    }
  });
}

async function obterStatus() {
  const c = config();
  if (c.simulate && !(c.baseUrl && c.apiKey && c.instance)) {
    return {
      configurado: true,
      conectado: true,
      simulado: true,
      instancia: c.instance || 'integrativo-simulado',
      estado: 'open',
      mensagem: 'Evolution API em modo simulado para teste/alfa.'
    };
  }

  if (!configurado()) {
    return { configurado: false, conectado: false, erro: 'Evolution API não configurada.' };
  }

  const { data } = await cliente().get(`/instance/connectionState/${encodeURIComponent(c.instance)}`);
  const estado = data?.instance?.state || data?.state || data?.status || '';
  return {
    configurado: true,
    instancia: c.instance,
    conectado: String(estado).toLowerCase() === 'open',
    estado,
    raw: data
  };
}

async function enviarTexto({ telefone, texto, delay = 1200 }) {
  const c = config();
  const numero = normalizarTelefone(telefone);
  if (!numero || !texto) {
    const erro = new Error('Telefone e texto são obrigatórios.');
    erro.codigo = 'EVOLUTION_INVALID_PAYLOAD';
    throw erro;
  }

  if (c.simulate && !(c.baseUrl && c.apiKey && c.instance)) {
    console.log('[Evolution SIMULADO]', { telefone: numero, texto });
    return {
      enviado: true,
      simulado: true,
      instancia: c.instance || 'integrativo-simulado',
      telefone: numero,
      resposta: { status: 'simulado', delay }
    };
  }

  if (!configurado()) {
    const erro = new Error('Evolution API não configurada.');
    erro.codigo = 'EVOLUTION_NOT_CONFIGURED';
    throw erro;
  }

  const { data } = await cliente().post(
    `/message/sendText/${encodeURIComponent(c.instance)}`,
    {
      number: numero,
      text: texto,
      delay
    }
  );

  return {
    enviado: true,
    instancia: c.instance,
    telefone: numero,
    resposta: data
  };
}

module.exports = {
  config,
  configurado,
  normalizarTelefone,
  obterStatus,
  enviarTexto
};
