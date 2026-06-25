/**
 * UI compartilhada — consulta de bibliotecas terapêuticas com busca.
 */
window.BibliotecasUI = (function () {
  var ROTULOS_TIPO = {
    protocolo: 'Avaliação / diagnóstico',
    fonte: 'Fontes',
    tratamento: 'Condutas / tratamentos',
    encaminhamento: 'Encaminhamento',
    seguranca: 'Segurança / contraindicações',
    biblioteca: 'Bibliografia',
    erva: 'Fitoterápicos',
    dosha: 'Doshas',
    asana: 'Práticas corporais',
    tecnica: 'Técnicas',
    oleo: 'Óleos essenciais',
    medicamento: 'Medicamentos',
    exame: 'Exames',
    interacao: 'Interações'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rotuloTipo(tipo) {
    return ROTULOS_TIPO[tipo] || 'Registro clínico';
  }

  function renderItem(item) {
    var html = '<article class="conteudo-item" data-tipo="' + escapeHtml(item.tipo || '') + '">';
    html += '<div class="conteudo-item-topo">';
    html += '<span class="conteudo-tipo-badge">' + escapeHtml(rotuloTipo(item.tipo)) + '</span>';
    html += '<h3>' + escapeHtml(item.nome) + '</h3></div>';
    if (item.descricao) {
      html += '<p class="conteudo-desc">' + escapeHtml(item.descricao) + '</p>';
    }
    if (item.contraindicacoes) {
      html += '<div class="conteudo-alerta"><strong>Contraindicações / atenção:</strong> ' +
        escapeHtml(item.contraindicacoes) + '</div>';
    }
    if (item.referencia) {
      html += '<p class="conteudo-ref"><strong>Referência:</strong> ' + escapeHtml(item.referencia) + '</p>';
    }
    if (item.especialidade_nome) {
      html += '<p class="conteudo-meta">' + escapeHtml(item.especialidade_nome) + '</p>';
    }
    html += '</article>';
    return html;
  }

  function renderSecoes(secoes) {
    if (!secoes || !secoes.length) {
      return '<p class="conteudo-vazio">Nenhum registro encontrado para os filtros atuais.</p>';
    }
    return secoes.map(function (sec) {
      var html = '<section class="conteudo-secao" data-secao="' + escapeHtml(sec.tipo) + '">';
      html += '<h2 class="conteudo-secao-titulo">' + escapeHtml(sec.titulo) +
        ' <span class="conteudo-contagem">(' + sec.itens.length + ')</span></h2>';
      html += sec.itens.map(renderItem).join('');
      html += '</section>';
      return html;
    }).join('');
  }

  function renderFiltrosTipos(tipos, ativo) {
    var chips = ['<button type="button" class="filtro-tipo ativo" data-tipo="">Todos</button>'];
    (tipos || []).forEach(function (t) {
      if (!ROTULOS_TIPO[t]) return;
      var cls = ativo === t ? ' ativo' : '';
      chips.push('<button type="button" class="filtro-tipo' + cls + '" data-tipo="' +
        escapeHtml(t) + '">' + escapeHtml(ROTULOS_TIPO[t]) + '</button>');
    });
    return chips.join('');
  }

  async function carregarConteudo(apiUrl, token, biblioteca, opts) {
    opts = opts || {};
    var params = new URLSearchParams({ biblioteca: biblioteca });
    if (opts.busca) params.set('busca', opts.busca);
    if (opts.tipo) params.set('tipo', opts.tipo);
    var r = await fetch(apiUrl + '/bibliotecas/conteudo?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token }
    });
    var data = {};
    try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(data.erro || 'Falha ao carregar conteúdo.');
    return data;
  }

  async function pesquisarGlobal(apiUrl, token, termo) {
    var r = await fetch(apiUrl + '/bibliotecas/pesquisar?termo=' + encodeURIComponent(termo), {
      headers: { Authorization: 'Bearer ' + token }
    });
    var data = {};
    try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(data.erro || 'Falha na pesquisa.');
    return data;
  }

  return {
    escapeHtml: escapeHtml,
    rotuloTipo: rotuloTipo,
    renderItem: renderItem,
    renderSecoes: renderSecoes,
    renderFiltrosTipos: renderFiltrosTipos,
    carregarConteudo: carregarConteudo,
    pesquisarGlobal: pesquisarGlobal,
    ROTULOS_TIPO: ROTULOS_TIPO
  };
})();
