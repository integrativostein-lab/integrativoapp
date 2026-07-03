/**
 * Auto diagnóstico orientativo — anamnese clínica unificada + motor determinístico.
 */
window.AutoDiagnostico = (function () {
  var schema = null;
  var respostasGlobais = {};
  var etapaAtual = 0;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase() {
    return (window.CONFIG && CONFIG.API_URL) ? CONFIG.API_URL.replace(/\/$/, '') : '';
  }

  async function carregarSchema() {
    if (schema) return schema;
    var base = apiBase();
    if (!base) throw new Error('API não configurada.');
    var r = await fetch(base + '/anamneses/schema-publico?perfil=auto_diagnostico', { cache: 'no-store' });
    var data = await r.json();
    if (!r.ok) throw new Error(data.erro || 'Não foi possível carregar o formulário.');
    schema = data;
    return schema;
  }

  function enriquecerRespostas(respostas) {
    var r = Object.assign({}, respostas);
    var peso = parseFloat(r.peso_kg);
    var alt = parseFloat(r.altura_cm);
    if (peso > 0 && alt > 0) {
      var imc = (peso / ((alt / 100) * (alt / 100))).toFixed(1);
      r.hda_resumo = [
        r.idade_anos ? 'Idade ' + r.idade_anos + ' anos' : null,
        r.sexo_biologico ? 'Sexo: ' + r.sexo_biologico : null,
        'IMC ' + imc
      ].filter(Boolean).join(' · ');
    }
    if (r.tabagismo) {
      var tab = r.tabagismo;
      if (r.tabagismo_cigarros_dia && tab.indexOf('Fumo') >= 0) {
        tab += ' (' + r.tabagismo_cigarros_dia + ' cigarros/dia)';
      }
      if (r.tabagismo_tempo_sem_fumar && tab.indexOf('parei') >= 0) {
        tab += ' (parou há ' + r.tabagismo_tempo_sem_fumar + ')';
      }
      r.tabagismo = tab;
    }
    if (r.etilismo && r.etilismo !== 'Não bebo álcool') {
      var beb = r.etilismo;
      if (r.etilismo_frequencia) beb += ' · ' + r.etilismo_frequencia;
      if (r.etilismo_doses_por_vez) beb += ' · ' + r.etilismo_doses_por_vez + ' por vez';
      r.etilismo = beb;
    }
    var meds = [];
    if (r.medicamentos_marcados) {
      meds = String(r.medicamentos_marcados).split(/[;,]/).map(function (x) { return x.trim(); }).filter(Boolean);
    }
    if (r.medicamentos_uso) meds.push(String(r.medicamentos_uso).trim());
    if (meds.length) {
      r.medicamentos_uso = meds.filter(function (v, i, a) { return a.indexOf(v) === i; }).join('; ');
    }
    if (r.sintomas_relatados && r.queixa_principal) {
      r.queixa_principal = r.queixa_principal + '. Sintomas: ' + r.sintomas_relatados;
    } else if (r.sintomas_relatados && !r.queixa_principal) {
      r.queixa_principal = r.sintomas_relatados;
    }
    if (!r.alergias_medicamentos) r.alergias_medicamentos = 'Nenhuma informada';
    if (!r.medicamentos_uso) r.medicamentos_uso = 'Nenhum informado';
    return r;
  }

  var ROTULO_CONFIANCA = { alta: 'muito provável', moderada: 'possível', baixa: 'menos provável' };

  function normalizarVertentes(lista) {
    return (lista || []).map(function (v) {
      return {
        titulo: v.vertente || v.titulo,
        eixo: v.eixo,
        orientacao: v.orientacao,
        conduta: v.conduta,
        itens: [v.orientacao, v.conduta ? 'Conduta: ' + v.conduta : null].filter(Boolean)
      };
    });
  }

  function renderDestino(destino) {
    if (!destino) return '';
    var cls = destino.tipo || 'profissional';
    return '<div class="destino-box ' + cls + '">' +
      '<h3>' + escapeHtml(destino.titulo) + '</h3>' +
      '<p>' + escapeHtml(destino.mensagem) + '</p></div>';
  }

  function renderHipoteses(hipoteses, aviso) {
    if (!hipoteses || !hipoteses.length) {
      return '<p class="campo-dica">Não identificamos um padrão específico. Se os sintomas continuarem, converse com um profissional de saúde.</p>';
    }
    var html = '<div class="auto-aviso" style="background:#fffbeb;border-left-color:#f59e0b;color:#78350f;margin-bottom:14px;">' +
      '<strong>Isso não é diagnóstico.</strong> São possibilidades para você levar na consulta. ' + escapeHtml(aviso || '') + '</div>';
    html += '<div class="hipoteses-lista">';
    hipoteses.forEach(function (h) {
      var conf = ROTULO_CONFIANCA[h.confianca] || h.confianca;
      html += '<div class="hipotese-card">' +
        '<div class="nome">' + escapeHtml(h.nome) + '</div>' +
        '<div class="meta">Compatível com o que você relatou (' + escapeHtml(conf) + ')</div>' +
        '<div class="desc">' + escapeHtml(h.descricao) + '</div>' +
        '<div class="aviso-mini">Confirme sempre com médico ou terapeuta.</div></div>';
    });
    html += '</div>';
    return html;
  }

  function montarHtmlPdf(sintese) {
    var fd = sintese.respostas || {};
    var resumoHtml = (sintese.resumoApi || []).map(function (item) {
      return '<p><strong>' + escapeHtml(item.rotulo) + ':</strong> ' + escapeHtml(item.valor) + '</p>';
    }).join('');

    var vertHtml = '';
    (sintese.vertentes || []).forEach(function (v) {
      vertHtml += '<div style="margin-bottom:12px;"><strong>' + escapeHtml(v.titulo) + '</strong>';
      if (v.eixo) vertHtml += '<br><span style="font-size:12px;color:#64748b;">' + escapeHtml(v.eixo) + '</span>';
      vertHtml += '<ul style="margin:6px 0 0 18px;">';
      (v.itens || []).forEach(function (i) { vertHtml += '<li>' + escapeHtml(i) + '</li>'; });
      vertHtml += '</ul></div>';
    });

    var alertasHtml = '';
    if (sintese.seguranca && sintese.seguranca.alertas && sintese.seguranca.alertas.length) {
      alertasHtml = '<h4 style="color:#991b1b;">Alertas de segurança</h4><ul>';
      sintese.seguranca.alertas.forEach(function (a) {
        alertasHtml += '<li>' + escapeHtml(a.mensagem || a.titulo || '') + '</li>';
      });
      alertasHtml += '</ul>';
    }

    return (
      '<div class="pdf-header">' +
      '<h2 style="margin:0;color:#1e3a8a;">Seu resumo de bem-estar</h2>' +
      '<p style="margin:5px 0 0;font-size:12px;color:#64748b;">Integrativo.App · ' +
      new Date().toLocaleString('pt-BR') + '</p></div>' +
      '<p style="font-size:11px;color:#b45309;font-weight:600;">NÃO É DIAGNÓSTICO. Use para conversar com um profissional ou buscar urgência se necessário.</p>' +
      renderDestino(sintese.destino) +
      '<h4 style="color:#1e3a8a;">O que pode estar relacionado ao que você sente</h4>' +
      renderHipoteses(sintese.hipoteses, sintese.aviso_hipoteses) +
      '<h4 style="color:#1e3a8a;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">O que você nos contou</h4>' + resumoHtml +
      '<h4 style="color:#1e3a8a;margin-top:16px;">Dicas de cuidado integrativo</h4>' + vertHtml + alertasHtml +
      '<p style="font-size:10px;color:#94a3b8;margin-top:20px;">' + escapeHtml(sintese.aviso_legal || '') + '</p>'
    );
  }

  async function gerarSintese(respostas) {
    var base = apiBase();
    if (!base) throw new Error('Serviço indisponível.');
    var payload = enriquecerRespostas(respostas);
    var r = await fetch(base + '/auto-diagnostico/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas: payload })
    });
    var data = {};
    try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(data.erro || 'Não foi possível gerar a síntese.');

    var vertentes = normalizarVertentes(data.vertentes);
    return {
      respostas: payload,
      resumoApi: data.resumo || [],
      vertentes: vertentes,
      hipoteses: data.hipoteses || [],
      destino: data.destino,
      seguranca: data.seguranca,
      aviso_legal: data.aviso_legal,
      aviso_hipoteses: data.aviso_hipoteses,
      motor: data.motor
    };
  }

  function salvarPdf(elementId) {
    var el = document.getElementById(elementId || 'pdf-area');
    if (!el || typeof html2pdf === 'undefined') throw new Error('Gerador de PDF indisponível.');

    // Captura a partir de um clone limpo posicionado no topo da página.
    // Capturar o elemento original (que fica no meio de uma página rolada) fazia
    // o html2canvas incluir o deslocamento de rolagem e gerar uma primeira página em branco.
    var wrapper = document.createElement('div');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '-10000px';
    wrapper.style.width = '760px';
    wrapper.style.padding = '24px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#0f172a';
    wrapper.innerHTML = el.innerHTML;
    document.body.appendChild(wrapper);

    function limpar() {
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    }

    return html2pdf().set({
      margin: 10,
      filename: 'integrativo-anamnese-' + new Date().toISOString().slice(0, 10) + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, windowWidth: 760 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(wrapper).save().then(limpar).catch(function (err) {
      limpar();
      throw err;
    });
  }

  function atualizarEtapasUi() {
    if (!schema) return;
    var container = document.getElementById('wizard-etapas-labels');
    if (!container) return;
    container.innerHTML = schema.etapas.map(function (e, i) {
      var cls = 'auto-etapa';
      if (i < etapaAtual) cls += ' concluida';
      if (i === etapaAtual) cls += ' ativa';
      return '<div class="' + cls + '">' + (i + 1) + ' · ' + escapeHtml(e.titulo) + '</div>';
    }).join('');
  }

  function renderEtapaAtual() {
    var alvo = document.getElementById('wizard-conteudo');
    if (!alvo || !schema) return;
    var etapa = schema.etapas[etapaAtual];
    var config = { obrigatorios: schema.obrigatorios || schema.padrao?.obrigatorios || [] };
    alvo.innerHTML = '<div class="cabecalho-clinico"><h2>' + escapeHtml(etapa.titulo) + '</h2>' +
      '<p>' + escapeHtml(etapa.subtitulo || '') + '</p></div>' +
      AnamneseUI.renderEtapa(etapa, schema, respostasGlobais, config);
    AnamneseUI.bindInteracoes(alvo);

    var btnAnt = document.getElementById('btn-anterior');
    var btnProx = document.getElementById('btn-proximo');
    if (btnAnt) btnAnt.style.display = etapaAtual === 0 ? 'none' : '';
    if (btnProx) btnProx.textContent = etapaAtual === schema.etapas.length - 1 ? 'Gerar síntese' : 'Próximo';
    atualizarEtapasUi();
  }

  function mesclarRespostasParciais() {
    var alvo = document.getElementById('wizard-conteudo');
    if (!alvo) return;
    Object.assign(respostasGlobais, AnamneseUI.coletarRespostas(alvo));
  }

  function validarEtapaAtual() {
    mesclarRespostasParciais();
    var etapa = schema.etapas[etapaAtual];
    if (etapa.tipo === 'checklist' || etapa.tipo === 'medicamentos') return [];
    if (etapa.tipo === 'sexo') {
      return AnamneseUI.validarObrigatorios(respostasGlobais, schema.obrigatorios, []);
    }
    var ids = schema.campos_por_etapa[etapa.id] || [];
    var camposVisiveis = ids.filter(function (id) {
      var c = (schema.campos || []).find(function (x) { return x.id === id; });
      return c && AnamneseUI.deveMostrarCampo(c, respostasGlobais);
    });
    return AnamneseUI.validarObrigatorios(respostasGlobais, schema.obrigatorios, camposVisiveis);
  }

  var CAMPOS_CONDICIONAIS = ['tabagismo', 'etilismo'];

  async function initWizard() {
    await carregarSchema();
    etapaAtual = 0;
    respostasGlobais = {};
    window.onAnamneseCampoAlterado = function (nome) {
      if (CAMPOS_CONDICIONAIS.indexOf(nome) < 0) return;
      mesclarRespostasParciais();
      renderEtapaAtual();
    };
    renderEtapaAtual();

    document.getElementById('btn-anterior').onclick = function () {
      mesclarRespostasParciais();
      if (etapaAtual > 0) { etapaAtual--; renderEtapaAtual(); }
    };

    document.getElementById('btn-proximo').onclick = async function () {
      var faltando = validarEtapaAtual();
      var msg = document.getElementById('msg-validacao');
      if (faltando.length) {
        msg.textContent = 'Preencha os campos obrigatórios desta etapa (' + faltando.length + ').';
        return;
      }
      msg.textContent = '';
      mesclarRespostasParciais();

      if (etapaAtual < schema.etapas.length - 1) {
        etapaAtual++;
        renderEtapaAtual();
        return;
      }

      msg.textContent = 'Gerando síntese…';
      try {
        var sintese = await gerarSintese(respostasGlobais);
        if (window.onSintesePronta) window.onSintesePronta(sintese);
        msg.textContent = '';
      } catch (err) {
        msg.textContent = err.message || 'Erro ao gerar síntese.';
      }
    };
  }

  return {
    carregarSchema: carregarSchema,
    initWizard: initWizard,
    gerarSintese: gerarSintese,
    montarHtmlPdf: montarHtmlPdf,
    renderDestino: renderDestino,
    renderHipoteses: renderHipoteses,
    salvarPdf: salvarPdf,
    escapeHtml: escapeHtml,
    enriquecerRespostas: enriquecerRespostas
  };
})();
