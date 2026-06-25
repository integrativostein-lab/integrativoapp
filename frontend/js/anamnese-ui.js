/**
 * UI helpers para formulários de anamnese integrativa (padrão clínico)
 */
window.AnamneseUI = (function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizarSexo(valor) {
    var v = String(valor || '').toLowerCase();
    if (v.indexOf('femin') >= 0) return 'feminino';
    if (v.indexOf('masc') >= 0) return 'masculino';
    return null;
  }

  function badgeGrupo(grupo) {
    if (grupo === 'pics') return '<span class="badge-grupo pics">PICS</span>';
    if (grupo === 'ocidental') return '<span class="badge-grupo ocidental">Clínico</span>';
    return '<span class="badge-grupo transversal">Transversal</span>';
  }

  function renderOpcoesCards(campo, valor, opts) {
    var obr = opts.obrigatorio ? ' required' : '';
    var html = '<div class="opcoes-cards" data-campo-cards="' + campo.id + '">';
    (campo.opcoes || []).forEach(function (op) {
      var sel = String(valor) === op ? ' selecionada' : '';
      html += '<label class="opcao-card' + sel + '">' +
        '<input type="radio" name="' + campo.id + '" value="' + escapeHtml(op) + '"' +
        (String(valor) === op ? ' checked' : '') + obr + '>' +
        escapeHtml(op) + '</label>';
    });
    html += '</div>';
    return html;
  }

  function renderEscala(campo, valor, opts) {
    var id = 'campo_' + campo.id;
    var html = '<div class="escala-row" data-escala="' + campo.id + '">';
    for (var n = 0; n <= 10; n++) {
      var ativo = String(valor) === String(n) ? ' ativo' : '';
      html += '<button type="button" class="escala-btn' + ativo + '" data-valor="' + n + '">' + n + '</button>';
    }
    html += '<input type="hidden" id="' + id + '" name="' + campo.id + '" value="' + escapeHtml(valor || '') + '"' +
      (opts.obrigatorio ? ' required' : '') + '>';
    html += '</div>';
    return html;
  }

  function renderInput(campo, valor, opts) {
    opts = opts || {};
    var id = 'campo_' + campo.id;
    var pendente = opts.pendente ? ' campo-pendente' : '';
    var obr = opts.obrigatorio ? ' required' : '';
    var val = valor != null ? escapeHtml(valor) : '';

    if (campo.tipo === 'select' && campo.opcoes && campo.opcoes.length <= 6) {
      return renderOpcoesCards(campo, valor, opts);
    }

    if (campo.tipo === 'select') {
      var optsHtml = (campo.opcoes || []).map(function (op) {
        var sel = String(valor) === op ? ' selected' : '';
        return '<option value="' + escapeHtml(op) + '"' + sel + '>' + escapeHtml(op) + '</option>';
      }).join('');
      return '<select id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '"' + obr + '>' +
        '<option value="">Selecione...</option>' + optsHtml + '</select>';
    }

    if (campo.tipo === 'escala') {
      return renderEscala(campo, valor, opts);
    }

    if (campo.tipo === 'number') {
      return '<input type="number" id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" value="' + val + '" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + obr + '>';
    }

    if (campo.tipo === 'text') {
      return '<input type="text" id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" value="' + val + '" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + obr + '>';
    }

    return '<textarea id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" rows="3" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + obr + '>' + val + '</textarea>';
  }

  function renderCampo(campo, respostas, config) {
    config = config || {};
    var valor = respostas ? respostas[campo.id] : '';
    var pendente = (config.pendentes || []).indexOf(campo.id) >= 0;
    var obr = (config.obrigatorios || []).indexOf(campo.id) >= 0;
    var sexoAttr = campo.sexoAplicavel ? ' data-sexo-aplicavel="' + campo.sexoAplicavel + '"' : '';
    var html = '<div class="campo-anamnese' + (pendente ? ' pendente' : '') + '" data-campo-id="' + campo.id + '"' + sexoAttr + '>';
    html += '<label for="campo_' + campo.id + '">' + escapeHtml(campo.nome) + badgeGrupo(campo.grupo);
    if (obr) html += ' <span class="obrigatorio">*</span>';
    html += '</label>';
    if (campo.dica) html += '<p class="campo-dica">' + escapeHtml(campo.dica) + '</p>';
    html += renderInput(campo, valor, { pendente: pendente, obrigatorio: obr });
    html += '</div>';
    return html;
  }

  function renderChecklist(sintomasChecklist, respostas, sexo) {
    var s = normalizarSexo(sexo);
    var marcados = String(respostas.sintomas_relatados || '').split(/[;,]/).map(function (x) { return x.trim(); }).filter(Boolean);
    var html = '';

    (sintomasChecklist || []).forEach(function (grupo) {
      if (grupo.sexoAplicavel === 'feminino' && s !== 'feminino') return;
      if (grupo.sexoAplicavel === 'masculino' && s !== 'masculino') return;

      var itens = grupo.itens;
      if (s === 'masculino' && grupo.itensMasculino) itens = grupo.itensMasculino;

      html += '<div class="checklist-sistema"><h4>' + escapeHtml(grupo.sistema) + '</h4><div class="checklist-grid">';
      itens.forEach(function (item) {
        var checked = marcados.indexOf(item) >= 0 ? ' checked' : '';
        html += '<label class="check-item"><input type="checkbox" class="sintoma-check" value="' +
          escapeHtml(item) + '"' + checked + '> ' + escapeHtml(item) + '</label>';
      });
      html += '</div></div>';
    });
    return html;
  }

  function renderFormulario(campos, respostas, config) {
    var porCat = {};
    campos.forEach(function (c) {
      if (!porCat[c.categoria]) porCat[c.categoria] = [];
      porCat[c.categoria].push(c);
    });
    var html = '';
    Object.keys(porCat).forEach(function (cat) {
      html += '<section class="secao-anamnese"><h3>' + escapeHtml(cat) + '</h3><div class="grid-campos">';
      porCat[cat].forEach(function (c) {
        html += renderCampo(c, respostas, config);
      });
      html += '</div></section>';
    });
    return html;
  }

  function renderEtapa(etapa, schema, respostas, config) {
    if (etapa.tipo === 'checklist') {
      return '<section class="secao-anamnese"><h3>Revisão por sistemas</h3>' +
        renderChecklist(schema.sintomas_checklist, respostas, respostas.sexo_biologico) + '</section>';
    }
    if (etapa.tipo === 'sexo') {
      var camposSexo = filtrarCamposSexo(schema.campos, respostas.sexo_biologico);
      if (!camposSexo.length) {
        return '<p class="campo-dica">Nenhuma pergunta adicional para o sexo biológico informado.</p>';
      }
      return renderFormulario(camposSexo, respostas, config);
    }
    var ids = schema.campos_por_etapa[etapa.id] || [];
    var campos = ids.map(function (id) {
      return (schema.campos || []).find(function (c) { return c.id === id; });
    }).filter(Boolean);
    return renderFormulario(campos, respostas, config);
  }

  function filtrarCamposSexo(campos, sexoBiologico) {
    var s = normalizarSexo(sexoBiologico);
    return (campos || []).filter(function (c) {
      if (!c.sexoAplicavel) return false;
      return c.sexoAplicavel === s;
    });
  }

  function bindInteracoes(container) {
    if (!container) return;
    container.querySelectorAll('.opcao-card input').forEach(function (input) {
      input.addEventListener('change', function () {
        container.querySelectorAll('[data-campo-cards="' + input.name + '"] .opcao-card').forEach(function (card) {
          card.classList.remove('selecionada');
        });
        if (input.checked) input.closest('.opcao-card').classList.add('selecionada');
      });
    });
    container.querySelectorAll('[data-escala]').forEach(function (row) {
      var hidden = row.querySelector('input[type="hidden"]');
      row.querySelectorAll('.escala-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          row.querySelectorAll('.escala-btn').forEach(function (b) { b.classList.remove('ativo'); });
          btn.classList.add('ativo');
          if (hidden) hidden.value = btn.getAttribute('data-valor');
        });
      });
    });
  }

  function coletarRespostas(container) {
    var respostas = {};
    container.querySelectorAll('.anamnese-input, input[type="hidden"][name]').forEach(function (el) {
      if (el.name) respostas[el.name] = el.value;
    });
    container.querySelectorAll('input[type="radio"]:checked').forEach(function (el) {
      if (el.name) respostas[el.name] = el.value;
    });
    var sintomas = [];
    container.querySelectorAll('.sintoma-check:checked').forEach(function (el) {
      sintomas.push(el.value);
    });
    if (sintomas.length) respostas.sintomas_relatados = sintomas.join('; ');
    return respostas;
  }

  function validarObrigatorios(respostas, obrigatorios, etapaIds) {
    var faltando = [];
    (obrigatorios || []).forEach(function (id) {
      if (etapaIds && etapaIds.indexOf(id) < 0) return;
      var v = respostas[id];
      if (v === undefined || v === null || String(v).trim() === '') faltando.push(id);
    });
    return faltando;
  }

  function filtrarCampos(schema, opts) {
    opts = opts || {};
    return (schema || []).filter(function (c) {
      if (opts.idsAtivos && opts.idsAtivos.indexOf(c.id) < 0) return false;
      if (opts.parte === 1 && c.parte === 2) return false;
      if (opts.parte === 2 && c.parte === 1) return false;
      if (opts.grupo && opts.grupo !== 'todos' && c.grupo !== opts.grupo) return false;
      return true;
    });
  }

  return {
    renderFormulario: renderFormulario,
    renderCampo: renderCampo,
    renderEtapa: renderEtapa,
    renderChecklist: renderChecklist,
    coletarRespostas: coletarRespostas,
    validarObrigatorios: validarObrigatorios,
    filtrarCampos: filtrarCampos,
    filtrarCamposSexo: filtrarCamposSexo,
    bindInteracoes: bindInteracoes,
    normalizarSexo: normalizarSexo,
    escapeHtml: escapeHtml
  };
})();
