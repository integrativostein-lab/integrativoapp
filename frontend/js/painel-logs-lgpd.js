/**
 * Visualizador de logs LGPD para painéis admin e criador (super_admin).
 * Uso: PainelLogsLgpd.render('logs-container', '/admin');
 */
(function (global) {
  var CATEGORIAS = [
    '', 'autenticacao', 'consentimento', 'dados_pessoais', 'dados_sensiveis_saude',
    'administracao', 'exportacao', 'exclusao', 'acesso_negado', 'seguranca_clinica', 'sistema'
  ];

  function esc(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatarData(valor) {
    if (!valor) return '—';
    var d = new Date(valor);
    if (Number.isNaN(d.getTime())) return esc(valor);
    return d.toLocaleString('pt-BR');
  }

  function token() {
    return localStorage.getItem('integra_token');
  }

  async function api(apiPrefix, path) {
    var r = await fetch(CONFIG.API_URL + apiPrefix + path, {
      headers: { Authorization: 'Bearer ' + token() }
    });
    var d = await r.json();
    if (!r.ok) throw new Error(d.erro || d.detalhe || 'Erro ao carregar logs');
    return d;
  }

  function montarFiltros(apiPrefix) {
    var hoje = new Date().toISOString().slice(0, 10);
    var opts = CATEGORIAS.map(function (c) {
      var label = c ? c.replace(/_/g, ' ') : 'Todas as categorias';
      return '<option value="' + esc(c) + '">' + esc(label) + '</option>';
    }).join('');

    return ''
      + '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:20px;">'
      + '  <div class="form-grupo" style="margin:0;min-width:160px;"><label>Data</label>'
      + '    <input type="date" id="logs-data" value="' + hoje + '"></div>'
      + '  <div class="form-grupo" style="margin:0;min-width:180px;"><label>Categoria</label>'
      + '    <select id="logs-categoria">' + opts + '</select></div>'
      + '  <div class="form-grupo" style="margin:0;min-width:140px;"><label>De</label>'
      + '    <input type="datetime-local" id="logs-de"></div>'
      + '  <div class="form-grupo" style="margin:0;min-width:140px;"><label>Até</label>'
      + '    <input type="datetime-local" id="logs-ate"></div>'
      + '  <button class="btn btn-primario" type="button" id="logs-buscar">Buscar</button>'
      + '  <button class="btn" type="button" id="logs-arquivos-btn" style="background:#EDF2F7;color:var(--azul-escuro);">Arquivos JSONL</button>'
      + '</div>'
      + '<div id="logs-status" style="font-size:13px;color:var(--texto-medio);margin-bottom:12px;"></div>'
      + '<div id="logs-tabela-wrap"></div>'
      + '<div id="logs-arquivos-wrap" style="display:none;margin-top:20px;"></div>';
  }

  function montarTabela(eventos) {
    if (!eventos.length) {
      return '<p style="color:var(--texto-medio);">Nenhum evento encontrado para os filtros selecionados.</p>';
    }

    var linhas = eventos.map(function (ev) {
      var detalhes = ev.detalhes;
      if (typeof detalhes === 'string') {
        try { detalhes = JSON.parse(detalhes); } catch (e) { /* mantém string */ }
      }
      var detalhesTxt = detalhes && typeof detalhes === 'object'
        ? JSON.stringify(detalhes)
        : (detalhes || '');

      return ''
        + '<tr>'
        + '<td style="white-space:nowrap;font-size:12px;">' + formatarData(ev.criado_em) + '</td>'
        + '<td><code style="font-size:11px;">' + esc(ev.categoria) + '</code></td>'
        + '<td>' + esc(ev.acao) + '</td>'
        + '<td>' + esc(ev.usuario_nome || ev.usuario_tipo || ev.usuario_id || '—') + '</td>'
        + '<td>' + esc(ev.recurso || '—') + '</td>'
        + '<td>' + esc(ev.resultado || '—') + '</td>'
        + '<td style="font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis;" title="' + esc(detalhesTxt) + '">' + esc(detalhesTxt.slice(0, 80)) + '</td>'
        + '</tr>';
    }).join('');

    return ''
      + '<div style="overflow-x:auto;background:var(--branco);border-radius:var(--raio-borda);box-shadow:var(--sombra);">'
      + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      + '<thead><tr style="background:#EDF2F7;text-align:left;">'
      + '<th style="padding:10px;">Quando</th>'
      + '<th style="padding:10px;">Categoria</th>'
      + '<th style="padding:10px;">Ação</th>'
      + '<th style="padding:10px;">Usuário</th>'
      + '<th style="padding:10px;">Recurso</th>'
      + '<th style="padding:10px;">Resultado</th>'
      + '<th style="padding:10px;">Detalhes</th>'
      + '</tr></thead>'
      + '<tbody>' + linhas + '</tbody>'
      + '</table></div>';
  }

  async function buscarLogs(apiPrefix) {
    var status = document.getElementById('logs-status');
    var wrap = document.getElementById('logs-tabela-wrap');
    var data = document.getElementById('logs-data').value;
    var categoria = document.getElementById('logs-categoria').value;
    var de = document.getElementById('logs-de').value;
    var ate = document.getElementById('logs-ate').value;

    status.textContent = 'Carregando logs...';
    wrap.innerHTML = '';

    try {
      var params = new URLSearchParams({ limite: '200', data: data });
      if (categoria) params.set('categoria', categoria);
      if (de) params.set('de', new Date(de).toISOString());
      if (ate) params.set('ate', new Date(ate).toISOString());

      var resultado = await api(apiPrefix, '/logs?' + params.toString());
      var eventos = resultado.eventos || resultado;
      if (!Array.isArray(eventos)) eventos = [];

      var origem = resultado.origem ? ' (' + resultado.origem + ')' : '';
      var aviso = resultado.aviso ? ' — fallback: ' + resultado.aviso : '';
      status.textContent = eventos.length + ' evento(s)' + origem + aviso;
      wrap.innerHTML = montarTabela(eventos);
    } catch (error) {
      status.textContent = '';
      wrap.innerHTML = '<p style="color:#E53E3E;">' + esc(error.message) + '</p>';
    }
  }

  async function listarArquivos(apiPrefix) {
    var box = document.getElementById('logs-arquivos-wrap');
    box.style.display = 'block';
    box.innerHTML = '<p>Carregando arquivos...</p>';

    try {
      var arquivos = await api(apiPrefix, '/logs/arquivos');
      if (!arquivos.length) {
        box.innerHTML = '<p style="color:var(--texto-medio);">Nenhum arquivo JSONL encontrado.</p>';
        return;
      }

      box.innerHTML = ''
        + '<h3 style="margin-bottom:12px;">Arquivos de auditoria (JSONL)</h3>'
        + '<div style="display:grid;gap:8px;">'
        + arquivos.map(function (ar) {
          return ''
            + '<button type="button" class="btn logs-arquivo-item" data-arquivo="' + esc(ar.arquivo) + '" '
            + 'style="text-align:left;display:flex;justify-content:space-between;gap:12px;background:#EDF2F7;color:var(--azul-escuro);">'
            + '<span>' + esc(ar.arquivo) + '</span>'
            + '<span style="font-size:12px;color:var(--texto-medio);">' + esc(formatarData(ar.modificado_em)) + '</span>'
            + '</button>';
        }).join('')
        + '</div>'
        + '<div id="logs-arquivo-conteudo" style="margin-top:16px;"></div>';

      box.querySelectorAll('.logs-arquivo-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var nome = btn.getAttribute('data-arquivo');
          var match = nome.match(/auditoria-(\d{4})-(\d{2})-(\d{2})\.jsonl/);
          if (!match) return;
          document.getElementById('logs-data').value = match[1] + '-' + match[2] + '-' + match[3];
          buscarLogs(apiPrefix);
        });
      });
    } catch (error) {
      box.innerHTML = '<p style="color:#E53E3E;">' + esc(error.message) + '</p>';
    }
  }

  function render(containerId, apiPrefix) {
    var el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = ''
      + '<h2>📋 Logs de auditoria LGPD</h2>'
      + '<p style="color:var(--texto-medio);margin-bottom:20px;">'
      + 'Trilha de acesso a dados pessoais, consentimentos, administração e segurança clínica. '
      + 'Acesso restrito a administradores.</p>'
      + montarFiltros(apiPrefix);

    document.getElementById('logs-buscar').addEventListener('click', function () {
      buscarLogs(apiPrefix);
    });
    document.getElementById('logs-arquivos-btn').addEventListener('click', function () {
      listarArquivos(apiPrefix);
    });

    buscarLogs(apiPrefix);
  }

  global.PainelLogsLgpd = { render: render };
})(window);
