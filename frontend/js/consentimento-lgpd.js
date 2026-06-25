(function (global) {
  const VERSAO = '2026-06-20';

  const TIPOS = {
    termos_privacidade: {
      id: 'termos_privacidade',
      obrigatorio: true,
      titulo: 'Termos de Uso e Política de Privacidade',
      resumo: 'Autorizo o tratamento dos meus dados cadastrais para criar conta, autenticar acesso e operar a plataforma conforme os Termos e a Política de Privacidade.',
      coleta: ['Nome', 'E-mail', 'Telefone (quando informado)', 'Tipo de conta', 'Registros de acesso'],
      finalidade: 'Cadastro, login, segurança, suporte, cumprimento contratual e comunicações essenciais do serviço.',
      baseLegal: 'Execução de contrato (LGPD Art. 7º, V) e consentimento quando aplicável (Art. 7º, I).',
      compartilhamento: 'Prestadores de hospedagem, pagamento e comunicação contratados, sempre com controle de acesso.',
      retencao: 'Enquanto a conta estiver ativa e pelo prazo legal após encerramento.',
      links: [{ rotulo: 'Política de Privacidade', href: 'privacidade.html' }, { rotulo: 'Termos de Uso', href: 'termos.html' }]
    },
    dados_saude: {
      id: 'dados_saude',
      obrigatorio: true,
      titulo: 'Dados sensíveis de saúde',
      resumo: 'Autorizo o tratamento de informações clínicas necessárias para agendamento, anamnese, prontuário, prescrições, teleconsulta e continuidade do cuidado.',
      coleta: ['Anamnese', 'Queixas e evolução', 'Prescrições e orientações', 'Agendamentos', 'Documentos clínicos vinculados ao atendimento'],
      finalidade: 'Prestação de serviços de saúde integrativa, registro profissional, segurança clínica e continuidade assistencial.',
      baseLegal: 'Tutela da saúde (LGPD Art. 11, II, f) e consentimento específico do titular quando exigido.',
      compartilhamento: 'Profissionais envolvidos no seu cuidado, interoperabilidade FHIR/TISS quando autorizado e obrigações legais.',
      retencao: 'Pelo tempo necessário ao cuidado, prazos profissionais aplicáveis e exigências legais.',
      perfis: ['paciente', 'profissional']
    },
    dados_profissionais: {
      id: 'dados_profissionais',
      obrigatorio: true,
      titulo: 'Dados profissionais e regulatórios',
      resumo: 'Autorizo o tratamento dos meus dados profissionais para validação de habilitação, exibição pública autorizada e operação clínica.',
      coleta: ['Conselho/registro profissional', 'Especialidades e bibliotecas', 'CNPJ (se informado)', 'Configurações de atendimento'],
      finalidade: 'Verificação de habilitação, agenda, prescrição, bibliotecas terapêuticas e transparência ao paciente.',
      baseLegal: 'Execução de contrato (Art. 7º, V) e cumprimento de obrigação legal/regulatória (Art. 7º, II).',
      compartilhamento: 'Conselhos/validações, pacientes que agendarem com você e integrações autorizadas.',
      retencao: 'Enquanto a conta profissional estiver ativa e conforme exigências dos conselhos.',
      perfis: ['profissional']
    },
    arquivamento_rastreabilidade: {
      id: 'arquivamento_rastreabilidade',
      obrigatorio: true,
      titulo: 'Arquivamento e trilha de auditoria',
      resumo: 'Estou ciente de que registros assistenciais podem ser arquivados no servidor autorizado da plataforma para rastreabilidade, segurança e continuidade do cuidado.',
      coleta: ['Logs de acesso', 'Registros clínicos', 'Histórico de consentimentos', 'Metadados de operações sensíveis'],
      finalidade: 'Segurança da informação, auditoria LGPD, continuidade assistencial e prevenção a fraudes.',
      baseLegal: 'Legítimo interesse com salvaguardas (Art. 7º, IX) e obrigações legais (Art. 7º, II).',
      compartilhamento: 'Não comercializamos dados. Acesso restrito a equipe autorizada e DPO.',
      retencao: 'Conforme política de retenção e logs auditáveis (consulte privacidade.html).',
      perfis: ['paciente', 'profissional']
    },
    pesquisa_anonimizada: {
      id: 'pesquisa_anonimizada',
      obrigatorio: false,
      titulo: 'Pesquisa clínica com dados anonimizados',
      resumo: 'Autorizo, de forma opcional e revogável, o uso de dados anonimizados para apoiar pesquisas clínicas e iniciativas de saúde pública, sem identificação direta.',
      coleta: ['Indicadores clínicos anonimizados', 'Padrões de uso agregados', 'Estatísticas de desfecho'],
      finalidade: 'Apoio a pesquisa científica, melhoria de protocolos e erradicação de doenças.',
      baseLegal: 'Consentimento (Art. 7º, I). Pode ser revogado a qualquer momento.',
      compartilhamento: 'Somente conjuntos anonimizados com parceiros de pesquisa autorizados.',
      retencao: 'Enquanto o consentimento estiver ativo ou até anonimização irreversível.',
      perfis: ['paciente', 'profissional']
    },
    notificacoes: {
      id: 'notificacoes',
      obrigatorio: false,
      titulo: 'Lembretes e comunicações operacionais',
      resumo: 'Autorizo receber lembretes de consulta, avisos de segurança, atualizações de conta e mensagens operacionais por e-mail, SMS ou WhatsApp.',
      coleta: ['E-mail', 'Telefone', 'Preferências de canal'],
      finalidade: 'Lembretes de agenda, confirmações, alertas de segurança e avisos importantes do serviço.',
      baseLegal: 'Consentimento (Art. 7º, I) ou execução de contrato para comunicações essenciais.',
      compartilhamento: 'Provedores de e-mail, SMS ou WhatsApp contratados.',
      retencao: 'Enquanto o consentimento estiver ativo.',
      perfis: ['paciente', 'profissional']
    },
    teleconsulta_telessaude: {
      id: 'teleconsulta_telessaude',
      obrigatorio: false,
      titulo: 'Telessaúde — consentimento por consulta',
      resumo: 'Autorizo atendimento remoto conforme Lei 14.510/2022, com registro de TCLE por agendamento antes de cada teleconsulta clínica.',
      coleta: ['Consentimento por agendamento', 'Registro de início/fim', 'Metadados da sessão', 'Limites informados'],
      finalidade: 'Teleconsulta conforme Lei 14.510/2022 e Res. CFM 2.314/2022 quando aplicável.',
      baseLegal: 'Consentimento livre e esclarecido (LGPD Art. 7º, I) e tutela da saúde (Art. 11, II, f).',
      compartilhamento: 'Profissional do agendamento e trilha auditável do prontuário.',
      retencao: 'Conforme prontuário e logs de auditoria LGPD.',
      perfis: ['paciente', 'profissional']
    },
    teleconsulta_gravacao: {
      id: 'teleconsulta_gravacao',
      obrigatorio: false,
      titulo: 'Gravação de teleconsulta',
      resumo: 'Autorizo gravação de teleconsultas apenas quando todos os participantes concordarem, com retenção limitada e finalidade assistencial.',
      coleta: ['Áudio/vídeo da sessão', 'Metadados da consulta', 'Autorização dos participantes'],
      finalidade: 'Registro assistencial, supervisão clínica autorizada e segurança do atendimento remoto.',
      baseLegal: 'Consentimento específico (Art. 7º, I) e tutela da saúde quando aplicável.',
      compartilhamento: 'Somente profissionais autorizados e armazenamento seguro temporário.',
      retencao: 'Prazo curto definido na sessão (ex.: 7 dias), salvo obrigação legal distinta.',
      perfis: ['paciente', 'profissional']
    },
    compartilhamento_fhir: {
      id: 'compartilhamento_fhir',
      obrigatorio: false,
      titulo: 'Compartilhamento interoperável (FHIR/RNDS)',
      resumo: 'Autorizo exportação e interoperabilidade dos dados clínicos dos meus pacientes em padrão FHIR/RNDS, conforme minha responsabilidade profissional e base legal aplicável.',
      coleta: ['Dados clínicos estruturados', 'Identificadores de saúde autorizados'],
      finalidade: 'Continuidade do cuidado, interoperabilidade e integração com redes autorizadas de saúde.',
      baseLegal: 'Consentimento (Art. 7º, I) e tutela da saúde (Art. 11, II, f).',
      compartilhamento: 'Sistemas de saúde autorizados pelo titular ou por lei.',
      retencao: 'Conforme necessidade da interoperabilidade e registro de exportação.',
      perfis: ['profissional']
    },
    cobranca_assinatura: {
      id: 'cobranca_assinatura',
      obrigatorio: true,
      titulo: 'Cobrança, assinatura e meios de pagamento',
      resumo: 'Autorizo o tratamento dos dados necessários para cobrança da assinatura, comissões sobre consultas quando aplicável, emissão de recibos/notas e gestão do plano contratado.',
      coleta: ['Dados de pagamento tokenizados', 'Histórico de assinatura', 'Plano contratado', 'Comissões sobre consultas'],
      finalidade: 'Faturamento recorrente ou pontual, conciliação financeira, cumprimento fiscal e transparência comercial.',
      baseLegal: 'Execução de contrato (Art. 7º, V) e cumprimento de obrigação legal (Art. 7º, II).',
      compartilhamento: 'Gateways de pagamento e prestadores fiscais/contábeis contratados.',
      retencao: 'Pelo prazo legal e enquanto houver relação contratual ou obrigação fiscal.',
      perfis: ['profissional']
    }
  };

  function tiposParaPerfil(perfil) {
    const modoLancamento = typeof global !== 'undefined' && global.CONFIG?.MODO_LANCAMENTO?.ativo;
    return Object.values(TIPOS).filter((tipo) => {
      if (modoLancamento && tipo.id === 'compartilhamento_fhir') return false;
      if (!tipo.perfis) return true;
      return tipo.perfis.includes(perfil);
    });
  }

  function esc(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function montarDetalhes(tipo) {
    const links = (tipo.links || [])
      .map((link) => `<li><a href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.rotulo)}</a></li>`)
      .join('');
    return `
      <dl>
        <dt>O que coletamos</dt>
        <dd><ul>${tipo.coleta.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></dd>
        <dt>Por que usamos</dt>
        <dd>${esc(tipo.finalidade)}</dd>
        <dt>Base legal (LGPD)</dt>
        <dd>${esc(tipo.baseLegal)}</dd>
        <dt>Com quem pode ser compartilhado</dt>
        <dd>${esc(tipo.compartilhamento)}</dd>
        <dt>Por quanto tempo</dt>
        <dd>${esc(tipo.retencao)}</dd>
        ${links ? `<dt>Documentos</dt><dd><ul>${links}</ul></dd>` : ''}
      </dl>
    `;
  }

  function renderItem(tipo, opts) {
    const checked = opts.valores && opts.valores[tipo.id] ? 'checked' : (tipo.obrigatorio && opts.modo === 'cadastro' ? '' : '');
    const disabled = opts.modo === 'visualizar' ? 'disabled' : '';
    const badge = tipo.obrigatorio
      ? '<span class="lgpd-badge obrigatorio">Obrigatório</span>'
      : '<span class="lgpd-badge opcional">Opcional</span>';
    const status = opts.estados && opts.estados[tipo.id]
      ? `<div class="lgpd-painel-status">Última decisão: <strong>${opts.estados[tipo.id].consentiu ? 'Autorizado' : 'Não autorizado'}</strong> em ${new Date(opts.estados[tipo.id].criado_em).toLocaleString('pt-BR')}</div>`
      : '';

    return `
      <article class="lgpd-item ${tipo.obrigatorio ? 'obrigatorio' : 'opcional'}" data-consent-id="${tipo.id}">
        <div class="lgpd-item-cabecalho">
          <input type="checkbox" id="consent-${tipo.id}" data-lgpd-consent="${tipo.id}" ${checked} ${disabled} ${tipo.obrigatorio ? 'required' : ''}>
          <div style="flex:1;">
            <div class="lgpd-item-titulo">${esc(tipo.titulo)} ${badge}</div>
            <div class="lgpd-item-resumo">${esc(tipo.resumo)}</div>
            <button type="button" class="lgpd-detalhes-btn" data-lgpd-toggle="${tipo.id}">Ver o que coletamos e por quê</button>
            <div class="lgpd-detalhes" id="lgpd-detalhes-${tipo.id}">${montarDetalhes(tipo)}</div>
            ${status}
          </div>
        </div>
      </article>
    `;
  }

  function render(container, options) {
    const alvo = typeof container === 'string' ? document.querySelector(container) : container;
    if (!alvo) return null;

    const perfil = options.perfil || 'geral';
    const modo = options.modo || 'cadastro';
    const tipos = tiposParaPerfil(perfil);
    const titulo = options.titulo || 'Autorizações e transparência de dados (LGPD)';
    const intro = options.intro || 'Antes de continuar, informamos o que será coletado, por qual motivo e com qual base legal. Marque as autorizações necessárias. Você pode revogar as opções facultativas a qualquer momento em Meus Dados e Privacidade.';

    alvo.innerHTML = `
      <section class="lgpd-bloco" data-lgpd-root="1">
        <h3>${esc(titulo)}</h3>
        <p class="lgpd-intro">${esc(intro)}</p>
        ${tipos.map((tipo) => renderItem(tipo, options)).join('')}
        <div class="lgpd-erro" data-lgpd-erro></div>
      </section>
    `;

    alvo.querySelectorAll('[data-lgpd-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-lgpd-toggle');
        const painel = alvo.querySelector(`#lgpd-detalhes-${id}`);
        if (!painel) return;
        const aberto = painel.classList.toggle('aberto');
        btn.textContent = aberto ? 'Ocultar detalhes' : 'Ver o que coletamos e por quê';
      });
    });

    return alvo;
  }

  function lgpdIgnorado() {
    return !!(global.CONFIG && global.CONFIG.AMBIENTE_TESTE);
  }

  function consentimentosAlfa(perfil) {
    const mapa = {};
    tiposParaPerfil(perfil || 'paciente', 'cadastro').forEach((tipo) => {
      mapa[tipo.id] = !!tipo.obrigatorio;
    });
    return mapa;
  }

  function payloadCadastroAlfa(perfil) {
    const mapa = consentimentosAlfa(perfil);
    return {
      lgpd_consentimento: 1,
      pesquisa_clinica_consentimento: false,
      consentimentos: mapa
    };
  }

  function valores(root) {
    const base = root || document;
    const saida = {};
    base.querySelectorAll('[data-lgpd-consent]').forEach((input) => {
      saida[input.getAttribute('data-lgpd-consent')] = input.checked;
    });
    return saida;
  }

  function validar(root) {
    if (lgpdIgnorado()) return true;
    const base = root || document;
    const erroEl = base.querySelector('[data-lgpd-erro]');
    const faltando = [];
    base.querySelectorAll('[data-lgpd-consent][required]').forEach((input) => {
      if (!input.checked) faltando.push(input.getAttribute('data-lgpd-consent'));
    });
    if (erroEl) {
      if (faltando.length) {
        erroEl.textContent = 'Para continuar, aceite todas as autorizações obrigatórias marcadas em azul.';
        erroEl.classList.add('visivel');
      } else {
        erroEl.textContent = '';
        erroEl.classList.remove('visivel');
      }
    }
    return faltando.length === 0;
  }

  function payloadCadastro(root, perfil) {
    if (lgpdIgnorado()) return payloadCadastroAlfa(perfil || 'paciente');
    const mapa = valores(root);
    return {
      lgpd_consentimento: mapa.termos_privacidade && mapa.dados_saude ? 1 : 0,
      pesquisa_clinica_consentimento: !!mapa.pesquisa_anonimizada,
      consentimentos: mapa
    };
  }

  async function apiFetch(path, options) {
    const base = (global.CONFIG && CONFIG.API_URL) ? CONFIG.API_URL : '/api';
    return fetch(`${base}${path}`, options);
  }

  async function carregarAtuais(token) {
    const r = await apiFetch('/auth/consentimentos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) throw new Error('Não foi possível carregar suas autorizações.');
    return r.json();
  }

  async function salvarLote(consentimentos, token, origem) {
    const r = await apiFetch('/auth/consentimentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ consentimentos, origem: origem || 'painel-privacidade' })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.erro || 'Erro ao salvar autorizações.');
    return d;
  }

  function aplicarEstados(root, estados) {
    if (!root || !estados) return;
    Object.entries(estados).forEach(([id, info]) => {
      const input = root.querySelector(`[data-lgpd-consent="${id}"]`);
      if (input && typeof info.consentiu === 'boolean') input.checked = info.consentiu;
    });
  }

  global.ConsentimentoLGPD = {
    VERSAO,
    TIPOS,
    tiposParaPerfil,
    lgpdIgnorado,
    consentimentosAlfa,
    payloadCadastroAlfa,
    render,
    valores,
    validar,
    payloadCadastro,
    carregarAtuais,
    salvarLote,
    aplicarEstados
  };
})(window);
