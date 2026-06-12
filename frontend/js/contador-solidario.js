// ============================================
// CONTADOR INTEGRATIVO SOLIDÁRIO
// Atualiza automaticamente ao detectar
// cadastro de organização social ou ONG
// ============================================

const ContadorSolidario = {
  metricas: {
    organizacoesSociais: 0,
    ongs: 0,
    profissionais: 0,
    pacientes: 0
  },

  async carregar() {
    try {
      const r = await fetch(`${CONFIG.API_URL}/criador/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('integra_token') || ''}` }
      });
      if (r.ok) {
        const d = await r.json();
        this.metricas = {
          organizacoesSociais: d.organizacoesSociais || d.entidades || 0,
          ongs: d.ongs || 0,
          profissionais: d.profissionais || 0,
          pacientes: d.pacientes || 0
        };
        this.atualizarTela();
      }
    } catch (e) {
      // Modo offline ou API indisponível — mostra zeros
    }
  },

  atualizarTela() {
    const container = document.getElementById('contador-solidario');
    if (!container) return;

    const total = this.metricas.organizacoesSociais + this.metricas.ongs;
    if (total === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div style="text-align:center;padding:12px;">
        <strong style="color:#1A365D;">🌍 Impacto Solidário</strong><br>
        <span style="font-size:13px;">
          🏛️ ${this.metricas.organizacoesSociais} organizações sociais apoiadas<br>
          🌱 ${this.metricas.ongs} ONGs recebendo o sistema<br>
          🩺 ${this.metricas.profissionais} profissionais impactados<br>
          👥 ${this.metricas.pacientes}+ pacientes beneficiados
        </span>
      </div>
    `;
  },

  init() {
    this.carregar();
    setInterval(() => this.carregar(), 300000); // Atualiza a cada 5 minutos
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ContadorSolidario.init();
});