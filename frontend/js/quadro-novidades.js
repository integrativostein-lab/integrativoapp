// ============================================
// QUADRO DE NOVIDADES — DASHBOARD DO PROFISSIONAL
// Exibe artigos recentes, atualizações do banco,
// notícias da ANVISA e novos estudos
// ============================================

const QuadroNovidades = {
  novidades: [],

  async carregar() {
    try {
      const token = localStorage.getItem('integra_token');
      if (!token) return;

      // Buscar artigos recentes do blog
      const r1 = await fetch(`${CONFIG.API_URL}/blog`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r1.ok) {
        const artigos = await r1.json();
        artigos.slice(0, 3).forEach(a => {
          this.novidades.push({
            tipo: 'artigo',
            titulo: a.titulo,
            autor: a.autor || 'Profissional',
            texto: a.conteudo ? a.conteudo.substring(0, 100) + '...' : '',
            link: `/blog.html?id=${a.id}`
          });
        });
      }

      // Buscar atualizações do banco de dados
      const r2 = await fetch(`${CONFIG.API_URL}/prescricoes/banco-terapeutico?limite=2`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r2.ok) {
        const atualizacoes = await r2.json();
        atualizacoes.forEach(a => {
          this.novidades.push({
            tipo: 'atualizacao',
            titulo: `📚 ${a.nome} — ${a.especialidade_nome || 'Banco Terapêutico'}`,
            texto: a.descricao ? a.descricao.substring(0, 100) + '...' : 'Novo registro disponível',
            link: '#'
          });
        });
      }

      this.exibir();
    } catch (e) {
      // Silencioso — não atrapalha o dashboard
    }
  },

  exibir() {
    const container = document.getElementById('quadro-novidades');
    if (!container) return;

    if (this.novidades.length === 0) {
      container.innerHTML = '<p style="color:#4A5568;font-size:13px;">Nenhuma novidade no momento.</p>';
      return;
    }

    let html = '';
    this.novidades.forEach(n => {
      const icone = n.tipo === 'artigo' ? '✍️' : '📚';
      html += `
        <div style="padding:8px 0;border-bottom:1px solid #E2E8F0;">
          <strong style="font-size:13px;">${icone} ${n.titulo}</strong><br>
          <span style="font-size:11px;color:#4A5568;">${n.autor ? 'Por ' + n.autor + ' — ' : ''}${n.texto}</span>
          <a href="${n.link}" style="font-size:11px;color:#DD6B20;">Ver mais →</a>
        </div>`;
    });

    container.innerHTML = html;
  },

  init() {
    this.carregar();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  QuadroNovidades.init();
});