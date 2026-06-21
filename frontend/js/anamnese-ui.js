/**
 * UI helpers para formulários de anamnese integrativa
 */
window.AnamneseUI = (function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function badgeGrupo(grupo) {
    if (grupo === 'pics') return '<span class="badge-grupo pics">PICS</span>';
    if (grupo === 'ocidental') return '<span class="badge-grupo ocidental">Medicina ocidental</span>';
    return '<span class="badge-grupo transversal">Transversal</span>';
  }

  function renderInput(campo, valor, opts) {
    opts = opts || {};
    var id = 'campo_' + campo.id;
    var pendente = opts.pendente ? ' campo-pendente' : '';
    var obr = opts.obrigatorio ? ' required' : '';
    var voz = ' data-voz data-voz-continuo="true"';
    var val = valor != null ? escapeHtml(valor) : '';

    if (campo.tipo === 'select') {
      var optsHtml = (campo.opcoes || []).map(function (op) {
        var sel = String(valor) === op ? ' selected' : '';
        return '<option value="' + escapeHtml(op) + '"' + sel + '>' + escapeHtml(op) + '</option>';
      }).join('');
      return '<select id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '"' + obr + '>' +
        '<option value="">Selecione...</option>' + optsHtml + '</select>';
    }

    if (campo.tipo === 'number' || campo.tipo === 'escala') {
      var min = campo.tipo === 'escala' ? ' min="0" max="10"' : '';
      return '<input type="number" id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" value="' + val + '" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + min + obr + voz + '>';
    }

    if (campo.tipo === 'text') {
      return '<input type="text" id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" value="' + val + '" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + obr + voz + '>';
    }

    return '<textarea id="' + id + '" name="' + campo.id + '" class="anamnese-input' + pendente + '" rows="3" placeholder="' + escapeHtml(campo.placeholder || '') + '"' + obr + voz + '>' + val + '</textarea>';
  }

  function renderCampo(campo, respostas, config) {
    config = config || {};
    var valor = respostas ? respostas[campo.id] : '';
    var pendente = (config.pendentes || []).indexOf(campo.id) >= 0;
    var obr = (config.obrigatorios || []).indexOf(campo.id) >= 0;
    var html = '<div class="campo-anamnese' + (pendente ? ' pendente' : '') + '" data-campo-id="' + campo.id + '">';
    html += '<label for="campo_' + campo.id + '">' + escapeHtml(campo.nome) + badgeGrupo(campo.grupo);
    if (obr) html += ' <span class="obrigatorio">*</span>';
    html += '</label>';
    if (campo.dica) html += '<p class="campo-dica">' + escapeHtml(campo.dica) + '</p>';
    html += renderInput(campo, valor, { pendente: pendente, obrigatorio: obr });
    html += '</div>';
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

  function coletarRespostas(container) {
    var respostas = {};
    container.querySelectorAll('.anamnese-input').forEach(function (el) {
      if (el.name) respostas[el.name] = el.value;
    });
    return respostas;
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
    coletarRespostas: coletarRespostas,
    filtrarCampos: filtrarCampos,
    escapeHtml: escapeHtml
  };
})();
