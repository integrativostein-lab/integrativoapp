/**
 * Auto diagnóstico orientativo — formulário local (medidas/hábitos/sintomas)
 * + síntese via motor determinístico do backend. Exportação em PDF no cliente.
 */
window.AutoDiagnostico = (function () {
  var DATA_SINTOMAS = [
    { cat: 'Dores de Cabeça', subs: ['Enxaqueca', 'Cefaleia tensional', 'Dor na nuca', 'Pressão nos olhos'] },
    { cat: 'Dores no Corpo', subs: ['Lombar (costas)', 'Pescoço/Cervical', 'Articulações (Juntas)', 'Muscular geral'] },
    { cat: 'Digestão / Estômago', subs: ['Azia (Queimação)', 'Refluxo', 'Gastrite / Dor estomacal', 'Estufamento / Gases'] },
    { cat: 'Intestino', subs: ['Prisão de ventre', 'Diarreia frequente', 'Síndrome do intestino irritável'] },
    { cat: 'Emocional / Mental', subs: ['Ansiedade', 'Insônia / Dificuldade para dormir', 'Estresse crônico', 'Desânimo / Tristeza'] }
  ];

  var DATA_MEDICAMENTOS = [
    { cat: 'Dor e Inflamação', subs: ['Paracetamol', 'Dipirona', 'Ibuprofeno', 'Nimesulida', 'Diclofenaco'] },
    { cat: 'Estômago e Digestão', subs: ['Omeprazol / Pantoprazol', 'Antiácidos', 'Domperidona'] },
    { cat: 'Pressão e Coração', subs: ['Enalapril / Losartana', 'Atenolol / Propranolol', 'Aspirina (AAS)'] },
    { cat: 'Diabetes / Açúcar', subs: ['Metformina', 'Gliclazida', 'Insulina'] },
    { cat: 'Controle Emocional', subs: ['Fluoxetina / Sertralina', 'Clonazepam / Alprazolam', 'Amitriptilina'] }
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function criarLista(container, data, namePrefix) {
    if (!container) return;
    container.innerHTML = '';
    data.forEach(function (item, idx) {
      var id = namePrefix + '-' + idx;
      var subsHtml = item.subs.map(function (sub) {
        return '<label class="sub-item"><input type="checkbox" name="' + namePrefix + '-sub" value="' +
          escapeHtml(sub) + '"> ' + escapeHtml(sub) + '</label>';
      }).join('');
      container.insertAdjacentHTML('beforeend',
        '<div class="categoria-item" id="item-' + id + '">' +
        '<div class="categoria-header" data-toggle="' + id + '">' +
        '<input type="checkbox" id="check-' + id + '" name="' + namePrefix + '" value="' + escapeHtml(item.cat) + '">' +
        '<span>' + escapeHtml(item.cat) + '</span></div>' +
        '<div class="sub-opcoes" id="sub-' + id + '">' + subsHtml + '</div></div>');
    });
    container.querySelectorAll('[data-toggle]').forEach(function (header) {
      header.addEventListener('click', function (e) {
        if (e.target.type === 'checkbox') return;
        var tid = header.getAttribute('data-toggle');
        var check = document.getElementById('check-' + tid);
        check.checked = !check.checked;
        toggleSub(tid, namePrefix);
      });
      header.querySelector('input[type=checkbox]').addEventListener('change', function () {
        toggleSub(header.getAttribute('data-toggle'), namePrefix);
      });
    });
  }

  function toggleSub(id, namePrefix) {
    var check = document.getElementById('check-' + id);
    var sub = document.getElementById('sub-' + id);
    var item = document.getElementById('item-' + id);
    if (!check || !sub || !item) return;
    if (check.checked) {
      sub.style.display = 'block';
      item.classList.add('ativa');
    } else {
      sub.style.display = 'none';
      item.classList.remove('ativa');
      sub.querySelectorAll('input').forEach(function (i) { i.checked = false; });
    }
  }

  function toggleCondicional(selectId, boxId) {
    var sel = document.getElementById(selectId);
    var box = document.getElementById(boxId);
    if (!sel || !box) return;
    var v = sel.value;
    box.style.display = (v === 'Sim' || v === 'Ex-fumante') ? 'block' : 'none';
  }

  function calcularImc(peso, alturaCm) {
    var p = parseFloat(peso);
    var a = parseFloat(alturaCm) / 100;
    if (!(p > 0 && a > 0)) return null;
    var imc = p / (a * a);
    var valor = imc.toFixed(1);
    var status = 'Peso normal';
    var classe = 'status-normal';
    if (imc < 18.5) { status = 'Abaixo do peso'; classe = 'status-alerta'; }
    else if (imc >= 25 && imc < 30) { status = 'Sobrepeso'; classe = 'status-alerta'; }
    else if (imc >= 30) { status = 'Obesidade'; classe = 'status-perigo'; }
    return { valor: valor, status: status, classe: classe };
  }

  function atualizarImcUi() {
    var peso = document.getElementById('peso');
    var altura = document.getElementById('altura');
    var box = document.getElementById('imc-box');
    if (!peso || !altura || !box) return null;
    var imc = calcularImc(peso.value, altura.value);
    if (!imc) {
      box.style.display = 'none';
      return null;
    }
    document.getElementById('imc-valor').textContent = imc.valor;
    var st = document.getElementById('imc-status');
    st.textContent = imc.status;
    st.className = 'imc-status ' + imc.classe;
    box.style.display = 'block';
    return imc;
  }

  function coletarCategorias(namePrefix) {
    var linhas = [];
    document.querySelectorAll('.categoria-item.ativa').forEach(function (item) {
      var catInput = item.querySelector('input[name="' + namePrefix + '"]');
      if (!catInput) return;
      var cat = catInput.value;
      var subs = Array.from(item.querySelectorAll('input[name="' + namePrefix + '-sub"]:checked'))
        .map(function (i) { return i.value; });
      linhas.push({
        cat: cat,
        subs: subs,
        texto: '• ' + cat + (subs.length ? ': ' + subs.join(', ') : '')
      });
    });
    return linhas;
  }

  function coletarFormulario() {
    var imc = atualizarImcUi() || calcularImc(
      document.getElementById('peso').value,
      document.getElementById('altura').value
    );
    var sintomas = coletarCategorias('sintoma');
    var medicamentos = coletarCategorias('medicamento');
    var outrosMeds = (document.getElementById('outros-meds') || {}).value || '';

    return {
      idade: document.getElementById('idade').value,
      genero: document.getElementById('genero').value,
      peso: document.getElementById('peso').value,
      altura: document.getElementById('altura').value,
      imc: imc,
      agua: document.getElementById('agua').value,
      sono: document.getElementById('sono').value,
      fuma: document.getElementById('fuma').value,
      qtdCigarro: document.getElementById('qtd-cigarro').value,
      bebe: document.getElementById('bebe').value,
      qtdBebida: document.getElementById('qtd-bebida').value,
      sintomas: sintomas,
      medicamentos: medicamentos,
      outrosMeds: outrosMeds.trim(),
      sintomasTexto: sintomas.map(function (s) { return s.texto.replace(/^• /, ''); }).join('; '),
      medicamentosTexto: medicamentos.map(function (m) { return m.texto.replace(/^• /, ''); }).join('; ')
    };
  }

  function validarFormulario(fd) {
    var faltando = [];
    if (!fd.idade) faltando.push('idade');
    if (!fd.genero) faltando.push('gênero');
    if (!fd.peso) faltando.push('peso');
    if (!fd.altura) faltando.push('altura');
    if (!fd.agua) faltando.push('água');
    if (!fd.sono) faltando.push('sono');
    return faltando;
  }

  function mapParaBackend(fd) {
    var estresse = fd.sintomas.some(function (s) {
      return /ansiedade|estresse|desânimo|tristeza|insônia/i.test(s.cat + ' ' + s.subs.join(' '));
    }) ? 8 : 4;
    var ansiedade = fd.sintomas.some(function (s) {
      return /ansiedade|estresse/i.test(s.cat + ' ' + s.subs.join(' '));
    }) ? 8 : 3;

    var digestao = '';
    if (fd.sintomas.some(function (s) {
      return /digest|estômago|estomago|intestin|azia|refluxo|gastrite|estufamento|prisão|diarreia/i.test(s.cat);
    })) {
      digestao = 'Frágil / lenta';
    }

    return {
      queixa_principal: fd.sintomasTexto || 'Avaliação integrativa de bem-estar',
      hda_resumo: [
        'Idade ' + fd.idade + ' anos',
        'Gênero: ' + fd.genero,
        fd.imc ? 'IMC ' + fd.imc.valor + ' (' + fd.imc.status + ')' : null
      ].filter(Boolean).join(' · '),
      altura_cm: fd.altura,
      peso_kg: fd.peso,
      medicamentos_uso: [fd.medicamentosTexto, fd.outrosMeds].filter(Boolean).join('; ') || 'Nenhum informado',
      alergias_medicamentos: 'NKDA',
      qualidade_sono: parseFloat(fd.sono) < 6 ? 'Ruim' : (parseFloat(fd.sono) < 7 ? 'Regular' : 'Boa'),
      horas_sono: fd.sono,
      ingestao_agua: fd.agua + ' copos/dia',
      digestao: digestao,
      estresse: estresse,
      ansiedade: ansiedade,
      atividade_fisica: 'Não avaliado neste formulário',
      observacoes_livres: [
        fd.fuma !== 'Não' ? 'Tabagismo: ' + fd.fuma + (fd.qtdCigarro ? ' (' + fd.qtdCigarro + ' cig/dia)' : '') : '',
        fd.bebe !== 'Não' ? 'Álcool: ' + fd.bebe + (fd.qtdBebida ? ' (' + fd.qtdBebida + ')' : '') : ''
      ].filter(Boolean).join('; ')
    };
  }

  function montarResumoLocal(fd) {
    return [
      { nome: 'Idade', valor: fd.idade + ' anos' },
      { nome: 'Gênero', valor: fd.genero },
      { nome: 'Peso / Altura', valor: fd.peso + ' kg · ' + fd.altura + ' cm' },
      { nome: 'IMC', valor: fd.imc ? fd.imc.valor + ' (' + fd.imc.status + ')' : '—' },
      { nome: 'Água', valor: fd.agua + ' copos/dia' },
      { nome: 'Sono', valor: fd.sono + ' h/dia' },
      { nome: 'Tabagismo', valor: fd.fuma + (fd.qtdCigarro ? ' (' + fd.qtdCigarro + '/dia)' : '') },
      { nome: 'Álcool', valor: fd.bebe + (fd.qtdBebida ? ' (' + fd.qtdBebida + ')' : '') },
      { nome: 'Sintomas', valor: fd.sintomas.length ? fd.sintomas.map(function (s) { return s.texto; }).join(' ') : 'Nenhum relatado' },
      { nome: 'Medicamentos', valor: [fd.medicamentos.map(function (m) { return m.texto; }).join(' '), fd.outrosMeds].filter(Boolean).join(' ') || 'Nenhum relatado' }
    ];
  }

  function montarHtmlPdf(fd, sintese) {
    var resumoHtml = montarResumoLocal(fd).map(function (item) {
      return '<p><strong>' + escapeHtml(item.nome) + ':</strong> ' + escapeHtml(item.valor) + '</p>';
    }).join('');

    var vertHtml = '';
    (sintese.vertentes || []).forEach(function (v) {
      vertHtml += '<div style="margin-bottom:12px;"><strong>' + escapeHtml(v.titulo || v.vertente) + '</strong>';
      if (v.eixo) vertHtml += '<br><span style="font-size:12px;color:#64748b;">' + escapeHtml(v.eixo) + '</span>';
      vertHtml += '<ul style="margin:6px 0 0 18px;">';
      (v.itens || []).forEach(function (i) { vertHtml += '<li>' + escapeHtml(i) + '</li>'; });
      if (!v.itens && v.orientacao) vertHtml += '<li>' + escapeHtml(v.orientacao) + '</li>';
      if (v.conduta) vertHtml += '<li><em>' + escapeHtml(v.conduta) + '</em></li>';
      vertHtml += '</ul></div>';
    });

    var alertasHtml = '';
    if (sintese.seguranca && sintese.seguranca.alertas && sintese.seguranca.alertas.length) {
      alertasHtml = '<h4 style="color:#991b1b;margin-top:16px;">Alertas de segurança</h4><ul>';
      sintese.seguranca.alertas.forEach(function (a) {
        alertasHtml += '<li>' + escapeHtml(a.mensagem || a.titulo || '') + '</li>';
      });
      alertasHtml += '</ul>';
    }

    return (
      '<div class="pdf-header">' +
      '<h2 style="margin:0;color:#1e3a8a;">Síntese orientativa de bem-estar</h2>' +
      '<p style="margin:5px 0 0;font-size:12px;color:#64748b;">Integrativo.App · ' +
      new Date().toLocaleString('pt-BR') + '</p></div>' +
      '<p style="font-size:11px;color:#64748b;">Material educativo — não constitui diagnóstico médico.</p>' +
      '<h4 style="color:#1e3a8a;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Resumo da avaliação</h4>' +
      resumoHtml +
      '<h4 style="color:#1e3a8a;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-top:16px;">Recomendações integrativas</h4>' +
      '<p style="font-size:11px;color:#64748b;margin:0 0 10px;">Ayurveda · Naturopatia · Aromaterapia · MTC · Yoga e demais eixos aplicáveis ao seu relato.</p>' +
      vertHtml +
      alertasHtml +
      '<p style="font-size:10px;color:#94a3b8;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;">' +
      escapeHtml(sintese.aviso_legal || 'Consulte sempre seu profissional de saúde.') +
      '</p>'
    );
  }

  async function gerarSintese(formData, apiUrl) {
    var base = (apiUrl || '').replace(/\/$/, '');
    if (!base) throw new Error('Serviço indisponível.');

    var respostas = mapParaBackend(formData);
    var r = await fetch(base + '/auto-diagnostico/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas: respostas })
    });

    var data = {};
    try { data = await r.json(); } catch (_) {}

    if (!r.ok) {
      throw new Error(data.erro || 'Não foi possível gerar a síntese.');
    }

    var resumo = montarResumoLocal(formData);
    var vertentes = normalizarVertentesApi(data.vertentes);
    if (!vertentes.length) throw new Error('Nenhum eixo orientativo foi gerado.');

    return {
      formData: formData,
      respostas: respostas,
      resumo: resumo,
      vertentes: vertentes,
      seguranca: data.seguranca || null,
      aviso_legal: data.aviso_legal,
      motor: data.motor || 'deterministico_if_then',
      htmlPdf: null
    };
  }

  function salvarPdf(elementId) {
    var el = document.getElementById(elementId || 'pdf-area');
    if (!el || typeof html2pdf === 'undefined') {
      throw new Error('Gerador de PDF indisponível.');
    }
    return html2pdf().set({
      margin: 10,
      filename: 'integrativo-bem-estar-' + new Date().toISOString().slice(0, 10) + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  }

  function initFormulario() {
    criarLista(document.getElementById('lista-sintomas'), DATA_SINTOMAS, 'sintoma');
    criarLista(document.getElementById('lista-medicamentos'), DATA_MEDICAMENTOS, 'medicamento');

    var peso = document.getElementById('peso');
    var altura = document.getElementById('altura');
    if (peso) peso.addEventListener('input', atualizarImcUi);
    if (altura) altura.addEventListener('input', atualizarImcUi);

    var fuma = document.getElementById('fuma');
    var bebe = document.getElementById('bebe');
    if (fuma) fuma.addEventListener('change', function () { toggleCondicional('fuma', 'box-cigarro'); });
    if (bebe) bebe.addEventListener('change', function () { toggleCondicional('bebe', 'box-bebida'); });
  }

  return {
    initFormulario: initFormulario,
    coletarFormulario: coletarFormulario,
    validarFormulario: validarFormulario,
    gerarSintese: gerarSintese,
    montarHtmlPdf: montarHtmlPdf,
    salvarPdf: salvarPdf,
    escapeHtml: escapeHtml
  };
})();
