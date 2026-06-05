const TourGuiado = {
  passoAtual: 0,
  passos: [
    { elemento: '#menu-dashboard', titulo: '📊 Dashboard', texto: 'Resumo completo da sua prática.' },
    { elemento: '#menu-agenda', titulo: '📅 Agenda', texto: 'Gerencie seus horários e compromissos.' },
    { elemento: '#menu-pacientes', titulo: '👥 Pacientes', texto: 'Prontuários e formulários de anamnese.' }
  ],
  iniciar() {
    if (localStorage.getItem('integra_tour')) return;
    this.passoAtual = 0;
    this.criarOverlay();
    this.mostrarPasso();
  },
  criarOverlay() {
    const ov = document.createElement('div');
    ov.id = 'tour-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9998;';
    ov.addEventListener('click', () => this.finalizar());
    document.body.appendChild(ov);
    const tt = document.createElement('div');
    tt.id = 'tour-tooltip';
    tt.style.cssText = 'position:fixed;background:white;border-radius:12px;padding:24px;max-width:350px;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.2);';
    document.body.appendChild(tt);
  },
  mostrarPasso() {
    if (this.passoAtual >= this.passos.length) { this.finalizar(); return; }
    const p = this.passos[this.passoAtual];
    const el = document.querySelector(p.elemento);
    if (!el) { this.passoAtual++; this.mostrarPasso(); return; }
    el.style.boxShadow = '0 0 0 4px #DD6B20';
    el.style.zIndex = '9999';
    const r = el.getBoundingClientRect();
    const tt = document.getElementById('tour-tooltip');
    tt.style.top = r.top + 'px';
    tt.style.left = Math.min(r.right + 20, window.innerWidth - 370) + 'px';
    tt.innerHTML = `<h3 style="color:#1A365D;">${p.titulo}</h3><p style="margin:8px 0;">${p.texto}</p><span style="color:#999;font-size:12px;">${this.passoAtual+1}/${this.passos.length}</span> <button onclick="TourGuiado.proximo()" style="background:#1A365D;color:white;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;float:right;">Próximo →</button>`;
  },
  proximo() {
    const el = document.querySelector(this.passos[this.passoAtual].elemento);
    if (el) { el.style.boxShadow = ''; el.style.zIndex = ''; }
    this.passoAtual++;
    this.mostrarPasso();
  },
  finalizar() {
    document.getElementById('tour-overlay')?.remove();
    document.getElementById('tour-tooltip')?.remove();
    this.passos.forEach(p => { const el = document.querySelector(p.elemento); if (el) { el.style.boxShadow = ''; el.style.zIndex = ''; } });
    localStorage.setItem('integra_tour', 'true');
  }
};
window.TourGuiado = TourGuiado;