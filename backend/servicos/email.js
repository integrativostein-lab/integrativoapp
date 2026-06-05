const TEMPLATES = {
  boasVindas(nome) {
    return {
      assunto: '🌿 Bem-vindo ao Integra!',
      html: `<h1>Olá, ${nome}!</h1><p>Seu cadastro foi realizado com sucesso.</p>`
    };
  },
  recuperacaoSenha(nome, link) {
    return {
      assunto: '🔑 Recuperação de Senha - Integra',
      html: `<p>Olá, ${nome}!</p><a href="${link}">Redefinir Senha</a>`
    };
  }
};

module.exports = TEMPLATES;