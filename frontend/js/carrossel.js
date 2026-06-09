// ============================================
// CARROSSEL DE ESPECIALIDADES
// ============================================

const ESPECIALIDADES_CARROSSEL = [
  { titulo: 'Fitoterapia', descricao: 'Medicina com plantas', imagem: 'img/especialidade-fitoterapia.png' },
  { titulo: 'Acupuntura', descricao: 'Medicina Tradicional Chinesa', imagem: 'img/especialidade-acupuntura.png' },
  { titulo: 'Massoterapia', descricao: 'Terapia pelo toque', imagem: 'img/especialidade-massoterapia.png' },
  { titulo: 'Reiki', descricao: 'Energia e cura', imagem: 'img/especialidade-reiki.png' },
  { titulo: 'Aromaterapia', descricao: 'Óleos essenciais', imagem: 'img/especialidade-aromaterapia.png' },
  { titulo: 'Yoga', descricao: 'Equilíbrio corpo e mente', imagem: 'img/especialidade-yoga.png' }
];

const ODS_SELECIONADAS = [3, 4, 6, 8, 9, 10, 11, 16, 17];

const ODS_DESCRICOES = {
  3: { titulo: 'Saúde e Bem-estar', descricao: 'Garantir uma vida saudável e promover o bem-estar para todos, em todas as idades.' },
  4: { titulo: 'Educação de Qualidade', descricao: 'Assegurar educação inclusiva e equitativa de qualidade e promover oportunidades de aprendizagem.' },
  6: { titulo: 'Água Limpa e Saneamento', descricao: 'Garantir disponibilidade e gestão sustentável da água e saneamento para todos.' },
  8: { titulo: 'Trabalho Decente e Crescimento', descricao: 'Promover crescimento econômico sustentado, emprego pleno e trabalho decente para todos.' },
  9: { titulo: 'Indústria, Inovação e Infraestrutura', descricao: 'Construir infraestruturas resilientes e promover inovação e industrialização sustentável.' },
  10: { titulo: 'Redução das Desigualdades', descricao: 'Reduzir as desigualdades dentro dos países e entre eles.' },
  11: { titulo: 'Cidades e Comunidades Sustentáveis', descricao: 'Tornar as cidades e comunidades inclusivas, seguras, resilientes e sustentáveis.' },
  16: { titulo: 'Paz, Justiça e Instituições Fortes', descricao: 'Promover sociedades pacíficas e inclusivas para o desenvolvimento sustentável.' },
  17: { titulo: 'Parcerias para os Objetivos', descricao: 'Fortalecer os meios de implementação e revitalizar a parceria global para o desenvolvimento sustentável.' }
};

class Carrossel {
  constructor(containerId, items) {
    this.container = document.getElementById(containerId);
    this.items = items;
    this.currentIndex = 0;
    this.itemsPerPage = this.getItemsPerPage();
    this.init();
  }

  getItemsPerPage() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 3;
  }

  init() {
    this.render();
    this.attachEventListeners();
    window.addEventListener('resize', () => this.handleResize());
  }

  render() {
    const html = `
      <div class="carrossel-wrapper">
        <div class="carrossel-track" id="${this.container.id}-track">
          ${this.items.map((item, idx) => `
            <div class="carrossel-item" data-index="${idx}">
              <img src="${item.imagem}" alt="${item.titulo}" loading="lazy">
              <div class="carrossel-item-info">
                <p class="carrossel-item-titulo">${item.titulo}</p>
                <p class="carrossel-item-descricao">${item.descricao}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="carrossel-botoes">
        <button class="carrossel-btn prev" id="${this.container.id}-prev">←</button>
        <button class="carrossel-btn next" id="${this.container.id}-next">→</button>
      </div>
      <div class="carrossel-indicadores" id="${this.container.id}-indicadores">
        ${Array.from({ length: Math.ceil(this.items.length / this.itemsPerPage) })
          .map((_, idx) => `<div class="carrossel-indicador ${idx === 0 ? 'ativo' : ''}" data-page="${idx}"></div>`)
          .join('')}
      </div>
    `;
    this.container.innerHTML = html;
  }

  attachEventListeners() {
    const prevBtn = document.getElementById(`${this.container.id}-prev`);
    const nextBtn = document.getElementById(`${this.container.id}-next`);
    const indicadores = document.querySelectorAll(`#${this.container.id}-indicadores .carrossel-indicador`);

    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());
    indicadores.forEach(ind => {
      ind.addEventListener('click', (e) => this.goToPage(parseInt(e.target.dataset.page)));
    });
  }

  prev() {
    const maxPages = Math.ceil(this.items.length / this.itemsPerPage);
    this.currentIndex = (this.currentIndex - 1 + maxPages) % maxPages;
    this.updateCarrossel();
  }

  next() {
    const maxPages = Math.ceil(this.items.length / this.itemsPerPage);
    this.currentIndex = (this.currentIndex + 1) % maxPages;
    this.updateCarrossel();
  }

  goToPage(page) {
    this.currentIndex = page;
    this.updateCarrossel();
  }

  updateCarrossel() {
    const track = document.getElementById(`${this.container.id}-track`);
    const offset = -this.currentIndex * (100 / this.itemsPerPage);
    track.style.transform = `translateX(${offset}%)`;

    // Atualizar indicadores
    const indicadores = document.querySelectorAll(`#${this.container.id}-indicadores .carrossel-indicador`);
    indicadores.forEach((ind, idx) => {
      ind.classList.toggle('ativo', idx === this.currentIndex);
    });
  }

  handleResize() {
    const newItemsPerPage = this.getItemsPerPage();
    if (newItemsPerPage !== this.itemsPerPage) {
      this.itemsPerPage = newItemsPerPage;
      this.currentIndex = 0;
      this.render();
      this.attachEventListeners();
    }
  }
}

// Inicializar carrossel quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const carrosselContainer = document.getElementById('carrossel-especialidades');
  if (carrosselContainer) {
    new Carrossel('carrossel-especialidades', ESPECIALIDADES_CARROSSEL);
  }

  // Inicializar ODS
  const odsContainer = document.getElementById('ods-grid');
  if (odsContainer) {
    renderODS();
  }
});

function renderODS() {
  const odsGrid = document.getElementById('ods-grid');
  if (!odsGrid) return;

  const html = ODS_SELECIONADAS.map(num => `
    <div class="ods-item" data-ods="${num}" onclick="mostrarODSDescricao(${num})">
      <img src="img/ods-icons.jpg" alt="ODS ${num}" style="clip-path: inset(${(num - 1) * 11.11}% 0 ${100 - (num * 11.11)}% 0);">
      <div class="ods-item-numero">${num}</div>
    </div>
  `).join('');

  odsGrid.innerHTML = html;
}

function mostrarODSDescricao(num) {
  const descricao = ODS_DESCRICOES[num];
  const container = document.getElementById('ods-descricao');
  if (container) {
    container.innerHTML = `
      <h3>ODS ${num}: ${descricao.titulo}</h3>
      <p>${descricao.descricao}</p>
    `;
  }
}
