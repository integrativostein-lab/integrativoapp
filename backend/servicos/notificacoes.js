const axios = require('axios');
const evolution = require('./evolution-api');

function textoBoasVindas(nome) {
  return `Olá, ${nome}! Seja muito bem-vindo(a) ao Integrativo.App.

Antes de começar, recomendamos ler o manual com calma. Ele foi feito para você configurar o sistema com tranquilidade, deixar tudo rodando direitinho e evitar perda de tempo no dia a dia.

Manual: ${process.env.FRONTEND_URL || 'https://integrativoapp.vercel.app'}/manual.html

Estamos felizes com a parceria.`;
}

function textoCodigoValidacao(nome, codigo) {
  return `Olá, ${nome}! Seu código de validação do Integrativo.App é ${codigo}.

Digite esse código na página de pagamento para ativar sua assinatura. O código expira em 15 minutos.`;
}

function textoCancelamento(nome) {
  return `Olá, ${nome}.

Lamentamos o término da nossa parceria neste momento. Foi uma honra caminhar com você no Integrativo.App.

As portas continuam abertas para uma parceria futura, quando fizer sentido para sua prática profissional. Desejamos sucesso, bons atendimentos e uma jornada leve.`;
}

function htmlParaTexto(html) {
  return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

async function enviarEmail({ para, assunto, html, texto }) {
  if (!para) return { enviado: false, motivo: 'email-ausente' };

  const payload = {
    to: para,
    subject: assunto,
    html,
    text: texto || htmlParaTexto(html)
  };

  if (process.env.EMAIL_WEBHOOK_URL) {
    const { data } = await axios.post(process.env.EMAIL_WEBHOOK_URL, payload, {
      timeout: Number(process.env.EMAIL_TIMEOUT_MS || 15000),
      headers: process.env.EMAIL_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN}` }
        : undefined
    });
    return { enviado: true, canal: 'email', resposta: data };
  }

  console.log('[EMAIL SIMULADO]', payload);
  return { enviado: true, canal: 'email', simulado: true, resposta: payload };
}

async function enviarWhatsApp({ telefone, texto }) {
  if (!telefone) return { enviado: false, motivo: 'telefone-ausente' };
  try {
    return await evolution.enviarTexto({ telefone, texto });
  } catch (e) {
    console.warn('[WHATSAPP] envio não realizado:', e.message);
    return { enviado: false, canal: 'whatsapp', erro: e.message };
  }
}

async function enviarCodigoAssinatura({ usuario, codigo }) {
  const nome = usuario.nome || 'profissional';
  const texto = textoCodigoValidacao(nome, codigo);
  const html = `<p>Olá, ${nome}!</p><p>Seu código de validação do Integrativo.App é:</p><h2>${codigo}</h2><p>Digite esse código na página de pagamento para ativar sua assinatura. O código expira em 15 minutos.</p>`;
  const resultados = await Promise.allSettled([
    enviarEmail({ para: usuario.email, assunto: 'Código de validação da assinatura Integrativo.App', html, texto }),
    enviarWhatsApp({ telefone: usuario.telefone, texto })
  ]);
  return resultados.map((r) => (r.status === 'fulfilled' ? r.value : { enviado: false, erro: r.reason?.message || 'falha' }));
}

async function enviarBoasVindasAssinatura({ usuario }) {
  const nome = usuario.nome || 'profissional';
  const texto = textoBoasVindas(nome);
  const manualUrl = `${process.env.FRONTEND_URL || 'https://integrativoapp.vercel.app'}/manual.html`;
  const html = `<p>Olá, ${nome}!</p><p>Seja muito bem-vindo(a) ao Integrativo.App.</p><p>Antes de começar, recomendamos ler o manual com calma. Ele foi feito para você configurar o sistema com tranquilidade, deixar tudo rodando direitinho e evitar perda de tempo no dia a dia.</p><p><a href="${manualUrl}">Ler o manual do Integrativo.App</a></p><p>Estamos felizes com a parceria.</p>`;
  const resultados = await Promise.allSettled([
    enviarEmail({ para: usuario.email, assunto: 'Bem-vindo(a) ao Integrativo.App', html, texto }),
    enviarWhatsApp({ telefone: usuario.telefone, texto })
  ]);
  return resultados.map((r) => (r.status === 'fulfilled' ? r.value : { enviado: false, erro: r.reason?.message || 'falha' }));
}

async function enviarCancelamento({ usuario, recibo }) {
  const nome = usuario.nome || 'profissional';
  const textoBase = textoCancelamento(nome);
  const reciboTexto = recibo ? `\n\nRecibo de cancelamento:\n${recibo.texto}` : '';
  const htmlRecibo = recibo ? `<h3>Recibo de cancelamento</h3>${recibo.html}` : '';
  const html = `<p>Olá, ${nome}.</p><p>Lamentamos o término da nossa parceria neste momento. Foi uma honra caminhar com você no Integrativo.App.</p><p>As portas continuam abertas para uma parceria futura, quando fizer sentido para sua prática profissional. Desejamos sucesso, bons atendimentos e uma jornada leve.</p>${htmlRecibo}`;
  return enviarEmail({
    para: usuario.email,
    assunto: 'Cancelamento da assinatura Integrativo.App',
    html,
    texto: `${textoBase}${reciboTexto}`
  });
}

module.exports = {
  enviarCodigoAssinatura,
  enviarBoasVindasAssinatura,
  enviarCancelamento
};
