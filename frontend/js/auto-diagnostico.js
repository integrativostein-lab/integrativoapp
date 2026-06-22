/**
 * Auto diagnóstico orientativo — síntese via motor determinístico do backend (produção).
 * Não persiste dados no servidor; e-mail via mailto local.
 */
window.AutoDiagnostico = (function () {
  var schema = [];
  var configCampos = { campos_ativos: [], campos_obrigatorios: [] };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function texto(r, id) {
    return String(r[id] || '').trim();
  }

  function montarResumoCampos(respostas) {
    return schema
      .map(function (c) {
        var v = texto(respostas, c.id);
        if (!v) return null;
        return { nome: c.nome, valor: v };
      })
      .filter(Boolean);
  }

  function normalizarVertentesApi(lista) {
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

  function relatorioTexto(respostas, vertentes, resumo, extras) {
    extras = extras || {};
    var linhas = [
      'INTEGRATIVO.APP — Síntese orientativa (não diagnóstica)',
      'Gerado em ' + new Date().toLocaleString('pt-BR'),
      '',
      extras.aviso_legal || 'AVISO: Material educativo. Não substitui consulta médica ou terapêutica.',
      '',
      '—— RESUMO DA ANAMNESE ——'
    ];
    resumo.forEach(function (item) {
      var rotulo = item.nome || item.rotulo || item.id;
      linhas.push(rotulo + ': ' + item.valor);
    });
    linhas.push('');
    (vertentes || []).forEach(function (v) {
      var titulo = v.titulo || v.vertente || 'Vertente';
      linhas.push('—— ' + titulo.toUpperCase() + (v.eixo ? ' · ' + v.eixo : '') + ' ——');
      if (v.itens && v.itens.length) {
        v.itens.forEach(function (i) { linhas.push('• ' + i); });
      } else {
        if (v.orientacao) linhas.push('• ' + v.orientacao);
        if (v.conduta) linhas.push('  Conduta sugerida: ' + v.conduta);
      }
      linhas.push('');
    });
    if (extras.seguranca && extras.seguranca.alertas && extras.seguranca.alertas.length) {
      linhas.push('—— ALERTAS DE SEGURANÇA ——');
      extras.seguranca.alertas.forEach(function (a) {
        linhas.push('• [' + (a.gravidade || 'alerta') + '] ' + (a.mensagem || a.titulo || ''));
      });
      linhas.push('');
    }
    linhas.push('Consulte sempre seu profissional de saúde antes de mudanças de tratamento.');
    return linhas.join('\n');
  }

  async function gerarSintese(respostas, apiUrl) {
    var base = (apiUrl || '').replace(/\/$/, '');
    if (!base) {
      throw new Error('Serviço indisponível. Tente novamente em integrativo.app.');
    }

    var r = await fetch(base + '/auto-diagnostico/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas: respostas })
    });

    var data = {};
    try {
      data = await r.json();
    } catch (_) { /* resposta não-JSON */ }

    if (!r.ok) {
      throw new Error(data.erro || 'Não foi possível gerar a síntese. Tente novamente em alguns instantes.');
    }

    var resumo = (data.resumo || []).map(function (item) {
      return { nome: item.rotulo || item.id, valor: item.valor };
    });
    if (!resumo.length) resumo = montarResumoCampos(respostas);

    var vertentes = normalizarVertentesApi(data.vertentes);
    if (!vertentes.length) {
      throw new Error('Nenhum eixo orientativo foi gerado. Revise os campos e tente novamente.');
    }

    return {
      vertentes: vertentes,
      resumo: resumo,
      seguranca: data.seguranca || null,
      aviso_legal: data.aviso_legal,
      privacidade: data.privacidade,
      motor: data.motor || 'deterministico_if_then',
      textoCompleto: relatorioTexto(respostas, data.vertentes || [], resumo, {
        aviso_legal: data.aviso_legal,
        seguranca: data.seguranca
      })
    };
  }

  async function carregarSchema(apiUrl) {
    var base = (apiUrl || '').replace(/\/$/, '');
    if (!base) throw new Error('API indisponível');

    var r = await fetch(base + '/anamneses/schema-publico');
    if (!r.ok) throw new Error('Não foi possível carregar o formulário.');

    var data = await r.json();
    schema = data.campos || [];
    configCampos = {
      campos_ativos: data.padrao?.ativos || schema.map(function (c) { return c.id; }),
      campos_obrigatorios: data.padrao?.obrigatorios || []
    };
    return schema;
  }

  function validarObrigatorios(respostas) {
    return (configCampos.campos_obrigatorios || []).filter(function (id) {
      return !texto(respostas, id);
    });
  }

  return {
    carregarSchema: carregarSchema,
    gerarSintese: gerarSintese,
    validarObrigatorios: validarObrigatorios,
    getConfig: function () { return configCampos; },
    escapeHtml: escapeHtml
  };
})();
