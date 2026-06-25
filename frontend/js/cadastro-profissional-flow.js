(function (global) {
  const SESSION_KEY = 'integra_fluxo_profissional';
  const PLANOS_VALIDOS = ['freemium', 'guardioes_floresta', 'pro', 'clinic', 'enterprise'];

  function fmtMoeda(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function arredondarMoeda(valor) {
    return Math.round(Number(valor || 0) * 100) / 100;
  }

  function normalizarPlanoUrl(plano) {
    if (plano === 'premium') return 'clinic';
    return plano;
  }

  function obterPlanoUrl() {
    const params = new URLSearchParams(window.location.search);
    const plano = normalizarPlanoUrl(params.get('plano') || 'freemium');
    return PLANOS_VALIDOS.includes(plano) ? plano : 'freemium';
  }

  function obterPlanoConfig(plano) {
    return global.CONFIG?.PLANOS?.[plano] || global.CONFIG?.PLANOS?.freemium;
  }

  function lgpdIgnorado() {
    return !!(global.CONFIG?.AMBIENTE_TESTE || global.ConsentimentoLGPD?.lgpdIgnorado?.());
  }

  function passoCadastro() {
    return lgpdIgnorado() ? 1 : 2;
  }

  function montarFluxoEtapas(container, passoAtual, plano) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    const cfg = obterPlanoConfig(plano);
    const isFree = !cfg?.valor_mensal && !cfg?.sob_consulta;
    const etapa3 = isFree ? 'Ativação' : 'Pagamento';
    const ignoraLgpd = lgpdIgnorado();
    const labels = ignoraLgpd ? ['Cadastro', etapa3] : ['LGPD', 'Cadastro', etapa3];
    el.innerHTML = labels.map((label, idx) => {
      const num = idx + 1;
      let cls = '';
      if (num < passoAtual) cls = 'concluido';
      else if (num === passoAtual) cls = 'atual';
      return `<li class="${cls}"><span class="num">${num}</span>${label}</li>`;
    }).join('');
  }

  function salvarSessao(dados) {
    const atual = carregarSessao() || {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...atual, ...dados, atualizadoEm: Date.now() }));
  }

  function carregarSessao() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function limparSessao() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function exigirLgpdAprovada(plano) {
    if (lgpdIgnorado()) return true;
    const sessao = carregarSessao();
    if (!sessao?.lgpd?.consentimentos || sessao.plano !== plano) {
      window.location.href = `lgpd-profissional.html?plano=${encodeURIComponent(plano)}`;
      return false;
    }
    return true;
  }

  function validarSenhaForte(senha) {
    if (!senha || senha.length < 12) return 'A senha deve ter no mínimo 12 caracteres.';
    if (!/[A-Za-z]/.test(senha)) return 'Inclua pelo menos uma letra.';
    if (!/\d/.test(senha)) return 'Inclua pelo menos um número.';
    if (!/[^A-Za-z0-9\s]/.test(senha)) return 'Inclua pelo menos um símbolo.';
    return '';
  }

  function forcaSenha(senha) {
    let score = 0;
    if (senha.length >= 12) score += 1;
    if (senha.length >= 16) score += 1;
    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) score += 1;
    if (/\d/.test(senha)) score += 1;
    if (/[^A-Za-z0-9]/.test(senha)) score += 1;
    if (score >= 4) return { rotulo: 'Forte', classe: 'forte' };
    if (score >= 2) return { rotulo: 'Média', classe: 'media' };
    return { rotulo: 'Fraca', classe: 'fraca' };
  }

  function sugerirSenha() {
    const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    const nums = '23456789';
    const sims = '!@#$%&*?_-';
    const pick = (pool, n) => Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]).join('');
    const base = pick(letras, 8) + pick(nums, 3) + pick(sims, 2);
    return base.split('').sort(() => Math.random() - 0.5).join('');
  }

  function planoSemCobranca(planoKey) {
    const cfg = obterPlanoConfig(planoKey);
    if (!cfg || cfg.sob_consulta) return false;
    return !cfg.valor_mensal;
  }

  function calcularPrecoExibicao(planoKey, opts) {
    const cfg = obterPlanoConfig(planoKey);
    if (!cfg || cfg.sob_consulta) return { texto: 'Sob consulta', descontos: [] };
    if (!cfg.valor_mensal) return { texto: 'Grátis', descontos: ['Sem cobrança de assinatura', 'Sem comissão sobre consultas'] };

    let valor = arredondarMoeda(cfg.valor_mensal);
    const descontos = [];
    const planosAbrath = ['pro', 'clinic'];
    if (opts.abrath && planosAbrath.includes(planoKey)) {
      valor = arredondarMoeda(valor * 0.92);
      descontos.push('ABRATH 8%');
    }
    if (opts.pix) {
      valor = arredondarMoeda(valor * 0.95);
      descontos.push('PIX 5%');
    }
    return { texto: `${fmtMoeda(valor)}/mês`, descontos, valor };
  }

  async function verificarConselho(payload) {
    const base = global.CONFIG?.API_URL || '/api';
    const r = await fetch(`${base}/validacao/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return r.json();
  }

  async function carregarConselhos() {
    const base = global.CONFIG?.API_URL || '/api';
    const r = await fetch(`${base}/validacao/conselhos`);
    if (!r.ok) return [];
    const d = await r.json();
    return d.conselhos || [];
  }

  function especialidadesFiltradas(filtroFn) {
    let lista = global.CONFIG?.ESPECIALIDADES || [];
    if (global.ModoLancamento?.ativo?.()) {
      lista = global.ModoLancamento.especialidadesVisiveis(lista);
    }
    return lista.filter(filtroFn || (() => true));
  }

  function montarSelectEspecialidades(selectEl, lista, placeholder) {
    selectEl.innerHTML = `<option value="">${placeholder || 'Selecione...'}</option>`;
    lista.forEach((esp) => {
      const opt = document.createElement('option');
      opt.value = esp.nome;
      opt.textContent = esp.nome;
      opt.dataset.id = esp.id;
      if (esp.conselho) opt.dataset.conselho = esp.conselho;
      selectEl.appendChild(opt);
    });
  }

  function initLgpdProfissional() {
    const plano = obterPlanoUrl();
    if (lgpdIgnorado()) {
      salvarSessao({ plano, lgpd: global.ConsentimentoLGPD.payloadCadastroAlfa('profissional') });
      window.location.replace(`cadastro-profissional.html?plano=${encodeURIComponent(plano)}`);
      return;
    }
    const cfg = obterPlanoConfig(plano);
    if (plano === 'enterprise') {
      window.location.href = 'mailto:contato@integrativo.app?subject=Plano%20Enterprise%20Integrativo.App';
      return;
    }

    document.getElementById('plano-nome').textContent = cfg?.nome || plano;
    document.getElementById('plano-descricao').textContent = cfg?.descricao || '';
    document.getElementById('plano-preco').textContent = cfg?.sob_consulta
      ? 'Sob consulta'
      : (cfg?.valor_mensal ? `${fmtMoeda(cfg.valor_mensal)}/mês` : 'Grátis');

    montarFluxoEtapas('#fluxoEtapas', 1, plano);

    global.ConsentimentoLGPD.render('#consentimentos-lgpd', {
      perfil: 'profissional',
      modo: 'cadastro',
      titulo: 'Autorizações LGPD — profissional de saúde integrativa',
      intro: 'Como profissional, você tratará dados sensíveis de pacientes e dados profissionais próprios. Antes de abrir sua conta, apresentamos cada finalidade, base legal e escopo de uso. Autorizações obrigatórias são exigidas para operar com segurança, auditoria e conformidade regulatória.'
    });

    document.getElementById('btnContinuarLgpd').addEventListener('click', () => {
      if (!global.ConsentimentoLGPD.validar(document)) return;
      const payload = global.ConsentimentoLGPD.payloadCadastro(document);
      salvarSessao({ plano, lgpd: payload });
      window.location.href = `cadastro-profissional.html?plano=${encodeURIComponent(plano)}`;
    });
  }

  function initCadastroProfissional() {
    const plano = obterPlanoUrl();
    if (!exigirLgpdAprovada(plano)) return;

    const cfg = obterPlanoConfig(plano);
    const sessao = carregarSessao();
    const msg = document.getElementById('msg-fluxo');
    const btn = document.getElementById('btnCadastrar');

    document.getElementById('plano-nome').textContent = cfg?.nome || plano;
    document.getElementById('plano-descricao').textContent = cfg?.descricao || '';
    montarFluxoEtapas('#fluxoEtapas', passoCadastro(), plano);
    const tagHero = document.querySelector('.fluxo-hero .tag');
    if (tagHero) {
      tagHero.textContent = lgpdIgnorado()
        ? `Passo ${passoCadastro()} de 2 · Cadastro`
        : 'Passo 2 de 3 · Cadastro';
    }
    const linkLgpd = document.getElementById('linkVoltarLgpd');
    if (linkLgpd) linkLgpd.style.display = lgpdIgnorado() ? 'none' : '';
    const secCobranca = document.getElementById('secaoCobranca');
    if (secCobranca) secCobranca.style.display = planoSemCobranca(plano) ? 'none' : '';
    atualizarResumoPreco();

    const senhaEl = document.getElementById('senha');
    const forcaEl = document.getElementById('senha-forca');
    document.getElementById('btnSugerirSenha').addEventListener('click', () => {
      const sugestao = sugerirSenha();
      senhaEl.value = sugestao;
      document.getElementById('senha2').value = sugestao;
      senhaEl.dispatchEvent(new Event('input'));
    });
    senhaEl.addEventListener('input', () => {
      const f = forcaSenha(senhaEl.value);
      forcaEl.textContent = senhaEl.value ? `Força da senha: ${f.rotulo}` : '';
      forcaEl.className = `senha-forca ${f.classe}`;
    });

    document.getElementById('renovacaoAutomatica').addEventListener('change', atualizarAvisoRenovacao);
    document.getElementById('temRegistroProfissional').addEventListener('change', atualizarFluxoRegistro);
    document.querySelectorAll('input[name="temAbrath"]').forEach((el) => el.addEventListener('change', atualizarFluxoRegistro));
    document.querySelectorAll('input[name="modalidadeAtendimento"]').forEach((el) => el.addEventListener('change', () => {}));

    const selConselho = document.getElementById('conselhoSigla');
    const selEspRegistro = document.getElementById('especialidadeRegistro');
    const selOcup1 = document.getElementById('ocupacaoPrincipal');
    const selOcup2 = document.getElementById('ocupacaoSecundaria');
    const selOcup3 = document.getElementById('ocupacaoTerciaria');

    if (!global.CONFIG?.MODO_LANCAMENTO?.ativo) {
      carregarConselhos().then((lista) => {
        selConselho.innerHTML = '<option value="">Selecione o conselho...</option>';
        lista.forEach((item) => {
          const opt = document.createElement('option');
          opt.value = item.sigla;
          opt.textContent = `${item.sigla} — ${item.nome}`;
          selConselho.appendChild(opt);
        });
      });
    }

    montarSelectEspecialidades(selEspRegistro, especialidadesFiltradas(), 'Selecione a especialidade...');
    const selEspAbrath = document.getElementById('especialidadeAbrath');
    montarSelectEspecialidades(selOcup1, especialidadesFiltradas(), 'Ocupação principal...');
    montarSelectEspecialidades(selOcup2, especialidadesFiltradas(), 'Ocupação secundária (opcional)');
    montarSelectEspecialidades(selOcup3, especialidadesFiltradas(), 'Ocupação terciária (opcional)');
    montarSelectEspecialidades(selEspAbrath, especialidadesFiltradas(), 'Especialidade / ocupação principal...');

    selConselho.addEventListener('change', () => {
      const sigla = selConselho.value;
      montarSelectEspecialidades(
        selEspRegistro,
        especialidadesFiltradas((esp) => !sigla || esp.conselho === sigla || !esp.conselho),
        'Selecione a especialidade...'
      );
    });

    document.getElementById('btnVerificarRegistro').addEventListener('click', async () => {
      const btnVer = document.getElementById('btnVerificarRegistro');
      const out = document.getElementById('resultadoVerificacao');
      btnVer.disabled = true;
      out.innerHTML = '';
      try {
        const resultado = await verificarConselho({
          conselho: selConselho.value,
          uf: document.getElementById('ufConselho').value,
          numero: document.getElementById('numeroRegistro').value,
          nome: document.getElementById('nome').value
        });
        const cls = resultado.valido ? 'ok' : 'warn';
        out.innerHTML = `<span class="status-pill ${cls}">${resultado.mensagem || (resultado.valido ? 'Registro validado' : 'Verifique o registro informado')}</span>`;
      } catch (e) {
        out.innerHTML = '<span class="status-pill err">Não foi possível verificar agora. Tente novamente.</span>';
      } finally {
        btnVer.disabled = false;
      }
    });

    document.getElementById('cep').addEventListener('blur', async function () {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length !== 8) return;
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const d = await r.json();
        if (d.erro) return;
        document.getElementById('logradouro').value = d.logradouro || '';
        document.getElementById('cidade').value = d.localidade || '';
        document.getElementById('estado').value = d.uf || '';
      } catch (e) { /* ignore */ }
    });

    btn.addEventListener('click', async () => {
      msg.className = 'msg-fluxo';
      msg.textContent = '';

      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const senha = senhaEl.value;
      const senha2 = document.getElementById('senha2').value;
      const erroSenha = validarSenhaForte(senha);
      if (erroSenha) {
        msg.className = 'msg-fluxo err';
        msg.textContent = erroSenha;
        return;
      }
      if (senha !== senha2) {
        msg.className = 'msg-fluxo err';
        msg.textContent = 'As senhas não coincidem.';
        return;
      }

      const temRegistro = global.CONFIG?.MODO_LANCAMENTO?.ativo
        ? false
        : document.getElementById('temRegistroProfissional').value === 'sim';
      const temAbrath = document.querySelector('input[name="temAbrath"]:checked')?.value;
      let especialidade = '';
      let conselho = null;
      let ufConselho = null;
      let numeroRegistro = null;
      let registroAbrath = null;

      if (temRegistro) {
        conselho = document.getElementById('conselhoSigla').value;
        ufConselho = document.getElementById('ufConselho').value;
        numeroRegistro = document.getElementById('numeroRegistro').value.trim();
        especialidade = document.getElementById('especialidadeRegistro').value;
        if (!conselho || !numeroRegistro || !especialidade) {
          msg.className = 'msg-fluxo err';
          msg.textContent = 'Informe conselho, número de registro e especialidade.';
          return;
        }
      } else if (temAbrath === 'sim') {
        registroAbrath = document.getElementById('registroAbrath').value.trim();
        especialidade = document.getElementById('especialidadeAbrath').value;
        if (!registroAbrath || !especialidade) {
          msg.className = 'msg-fluxo err';
          msg.textContent = 'Informe registro ABRATH e especialidade principal.';
          return;
        }
      } else {
        especialidade = document.getElementById('ocupacaoPrincipal').value;
        if (!especialidade) {
          msg.className = 'msg-fluxo err';
          msg.textContent = 'Selecione sua ocupação principal.';
          return;
        }
      }

      const modalidade = document.querySelector('input[name="modalidadeAtendimento"]:checked')?.value || 'ambos';
      const renovacaoAutomatica = planoSemCobranca(plano)
        ? false
        : document.getElementById('renovacaoAutomatica').checked;
      const lgpd = sessao.lgpd || global.ConsentimentoLGPD.payloadCadastroAlfa('profissional');

      btn.disabled = true;
      btn.textContent = 'Criando conta...';

      try {
        const body = {
          nome,
          email,
          senha,
          telefone,
          plano,
          especialidade,
          cpf: document.getElementById('cpf').value.trim(),
          data_nascimento: document.getElementById('dataNascimento').value,
          cep: document.getElementById('cep').value.trim(),
          logradouro: document.getElementById('logradouro').value.trim(),
          numero_endereco: document.getElementById('numeroEndereco').value.trim(),
          complemento: document.getElementById('complemento').value.trim(),
          cidade: document.getElementById('cidade').value.trim(),
          estado: document.getElementById('estado').value.trim(),
          tem_registro_profissional: temRegistro,
          conselho,
          uf_conselho: ufConselho,
          numero_registro: numeroRegistro,
          registro_abrath: registroAbrath,
          tem_abrath: temAbrath || null,
          ocupacao_secundaria: document.getElementById('ocupacaoSecundaria').value || null,
          ocupacao_terciaria: document.getElementById('ocupacaoTerciaria').value || null,
          modalidade_atendimento: modalidade,
          renovacao_automatica: renovacaoAutomatica,
          abrath_verificada: temAbrath === 'sim',
          lgpd_consentimento: lgpd.lgpd_consentimento,
          pesquisa_clinica_consentimento: lgpd.pesquisa_clinica_consentimento,
          consentimentos: lgpd.consentimentos
        };

        const r = await fetch(`${global.CONFIG.API_URL}/auth/cadastro-profissional`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.erro || 'Erro ao cadastrar');

        localStorage.setItem('integra_token', d.token);
        localStorage.setItem('integra_usuario', JSON.stringify(d.usuario));
        limparSessao();

        if (planoSemCobranca(plano)) {
          const destino = global.AuthSessao?.urlPainel
            ? global.AuthSessao.urlPainel(d.usuario)
            : (d.usuario?.tipo === 'admin' ? 'painel-admin.html' : 'painel-terapeuta.html');
          window.location.href = destino;
        } else {
          window.location.href = `checkout.html?plano=${encodeURIComponent(plano)}&cadastro=1`;
        }
      } catch (err) {
        msg.className = 'msg-fluxo err';
        msg.textContent = err.message || 'Erro de conexão.';
        btn.disabled = false;
        btn.textContent = 'Concluir cadastro e continuar';
      }
    });

    function atualizarFluxoRegistro() {
      const temRegistro = document.getElementById('temRegistroProfissional').value === 'sim';
      document.getElementById('painelRegistro').classList.toggle('show', temRegistro);
      const semRegistro = document.getElementById('temRegistroProfissional').value === 'nao';
      document.getElementById('painelAbrath').classList.toggle('show', semRegistro);
      const abrath = document.querySelector('input[name="temAbrath"]:checked')?.value;
      document.getElementById('grupoRegistroAbrath').style.display = abrath === 'sim' ? 'block' : 'none';
      document.getElementById('painelOcupacoes').classList.toggle('show', semRegistro && abrath === 'nao');
      atualizarResumoPreco();
    }

    function atualizarAvisoRenovacao() {
      const el = document.getElementById('avisoRenovacao');
      const marcado = document.getElementById('renovacaoAutomatica').checked;
      el.className = marcado ? 'aviso-legal info' : 'aviso-legal';
      el.innerHTML = marcado
        ? 'Renovação automática autorizada. A cobrança mensal será processada no cartão cadastrado, salvo cancelamento.'
        : 'Sem renovação automática: enviaremos avisos a partir de <strong>5 dias antes</strong> do fim do período, até o último dia para você renovar manualmente.';
    }

    function atualizarResumoPreco() {
      const abrath = document.querySelector('input[name="temAbrath"]:checked')?.value === 'sim';
      const calc = calcularPrecoExibicao(plano, { abrath, pix: true });
      document.getElementById('plano-preco').textContent = calc.texto;
      const tags = document.getElementById('descontos-tags');
      tags.innerHTML = (calc.descontos || [])
        .concat(['15 dias para arrependimento (1ª assinatura)'])
        .map((t) => `<span>${t}</span>`).join('');
    }

    document.querySelectorAll('input[name="temAbrath"]').forEach((el) => {
      el.addEventListener('change', atualizarResumoPreco);
    });

    atualizarFluxoRegistro();
    atualizarAvisoRenovacao();
  }

  global.CadastroProfissionalFlow = {
    initLgpdProfissional,
    initCadastroProfissional,
    obterPlanoUrl,
    montarFluxoEtapas,
    salvarSessao,
    carregarSessao,
    limparSessao
  };
})(window);
