const I18N = {
  currentLang: 'pt-BR',
  availableLangs: ['pt-BR', 'en', 'es', 'fr', 'ru', 'hi', 'zh', 'af', 'zu'],

  translations: {
    'pt-BR': {
      'hero.titulo': 'Encontre seu profissional integrativo',
      'hero.subtitulo': '47 especialidades. Agende online ou presencial.',
      'hero.buscar': 'Buscar Profissionais',
      'hero.baixar_app': '📱 Baixe o App Grátis',
      'nav.entrar': 'Entrar',
      'nav.planos': 'Planos',
      'footer.direitos': '🌿 Integrativo.App — Saúde Integrativa'
    },
    'en': {
      'hero.titulo': 'Find your integrative professional',
      'hero.subtitulo': '30 specialties. Book online or in-person.',
      'hero.buscar': 'Find Professionals',
      'hero.baixar_app': '📱 Download Free App',
      'nav.entrar': 'Login',
      'nav.planos': 'Plans',
      'footer.direitos': '🌿 Integrativo.App — Integrative Health'
    },
    'es': {
      'hero.titulo': 'Encuentra tu profesional integrativo',
      'hero.subtitulo': '47 especialidades. Reserva online o presencial.',
      'hero.buscar': 'Buscar Profesionales',
      'hero.baixar_app': '📱 Descarga la App Gratis',
      'nav.entrar': 'Entrar',
      'nav.planos': 'Planes',
      'footer.direitos': '🌿 Integrativo.App — Salud Integrativa'
    },
    'fr': {
      'hero.titulo': 'Trouvez votre professionnel intégratif',
      'hero.subtitulo': '30 spécialités. Réservez en ligne ou en personne.',
      'hero.buscar': 'Chercher des Professionnels',
      'hero.baixar_app': '📱 Téléchargez l\'App Gratuitement',
      'nav.entrar': 'Connexion',
      'nav.planos': 'Plans',
      'footer.direitos': '🌿 Integrativo.App — Santé Intégrative'
    },
    'ru': {
      'hero.titulo': 'Найдите своего интегративного специалиста',
      'hero.subtitulo': '30 специальностей. Запись онлайн или лично.',
      'hero.buscar': 'Найти специалистов',
      'hero.baixar_app': '📱 Скачать приложение бесплатно',
      'nav.entrar': 'Вход',
      'nav.planos': 'Планы',
      'footer.direitos': '🌿 Integrativo.App — Интегративное здоровье'
    },
    'hi': {
      'hero.titulo': 'अपने एकीकृत पेशेवर खोजें',
      'hero.subtitulo': '30 विशेषताएँ। ऑनलाइन या व्यक्तिगत रूप से बुक करें।',
      'hero.buscar': 'पेशेवर खोजें',
      'hero.baixar_app': '📱 मुफ्त ऐप डाउनलोड करें',
      'nav.entrar': 'लॉगिन',
      'nav.planos': 'योजनाएं',
      'footer.direitos': '🌿 Integrativo.App — एकीकृत स्वास्थ्य'
    },
    'zh': {
      'hero.titulo': '寻找您的综合健康专业人士',
      'hero.subtitulo': '30个专业。在线或亲自预约。',
      'hero.buscar': '寻找专业人士',
      'hero.baixar_app': '📱 免费下载应用',
      'nav.entrar': '登录',
      'nav.planos': '计划',
      'footer.direitos': '🌿 Integrativo.App — 综合健康'
    },
    'af': {
      'hero.titulo': 'Vind jou integrerende professioneel',
      'hero.subtitulo': '30 spesialiteite. Bespreek aanlyn of persoonlik.',
      'hero.buscar': 'Soek Professionele',
      'hero.baixar_app': '📱 Laai die App gratis af',
      'nav.entrar': 'Teken in',
      'nav.planos': 'Plan',
      'footer.direitos': '🌿 Integrativo.App — Integrerende Gesondheid'
    },
    'zu': {
      'hero.titulo': 'Thola uchwepheshe wakho wezempilo',
      'hero.subtitulo': 'Izinhlobo ezingama-30. Bhukha ku-inthanethi noma ngokuqondene.',
      'hero.buscar': 'Thola Ochwepheshe',
      'hero.baixar_app': '📱 Landa uhlelo lokusebenza mahhala',
      'nav.entrar': 'Ngena',
      'nav.planos': 'Izinhlelo',
      'footer.direitos': '🌿 Integrativo.App — Impilo Ehlanganisiwe'
    }
  },

  t(key) {
    const lang = this.currentLang;
    const translation = this.translations[lang]?.[key];
    if (!translation) {
      const fallback = this.translations['pt-BR']?.[key];
      return fallback || key;
    }
    return translation;
  },

  setLanguage(lang) {
    if (this.availableLangs.includes(lang)) {
      this.currentLang = lang;
      localStorage.setItem('integra_lang', lang);
      this.aplicarTraducoes();
    }
  },

  detectLanguage() {
    const saved = localStorage.getItem('integra_lang');
    if (saved && this.availableLangs.includes(saved)) return saved;
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('hi')) return 'hi';
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('af')) return 'af';
    if (browserLang.startsWith('zu')) return 'zu';
    return 'pt-BR';
  },

  init() {
    this.currentLang = this.detectLanguage();
    this.aplicarTraducoes();
    this.criarSeletorIdioma();
  },

  aplicarTraducoes() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  },

  criarSeletorIdioma() {
    const seletor = document.createElement('div');
    seletor.id = 'lang-selector';
    seletor.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      gap: 6px;
      background: rgba(255,255,255,0.95);
      padding: 6px 10px;
      border-radius: 30px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    `;

    const bandeiras = {
      'pt-BR': '🇧🇷',
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'ru': '🇷🇺',
      'hi': '🇮🇳',
      'zh': '🇨🇳',
      'af': '🇿🇦',
      'zu': '🇿🇦'
    };

    this.availableLangs.forEach(lang => {
      const btn = document.createElement('button');
      btn.textContent = bandeiras[lang] || lang;
      btn.title = lang;
      btn.style.cssText = `
        border: none;
        background: ${lang === this.currentLang ? 'var(--azul-escuro)' : 'transparent'};
        color: ${lang === this.currentLang ? 'white' : '#333'};
        padding: 6px 8px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        line-height: 1;
      `;
      btn.onclick = () => this.setLanguage(lang);
      seletor.appendChild(btn);
    });

    document.body.appendChild(seletor);
  }
};

document.addEventListener('DOMContentLoaded', () => I18N.init());
window.I18N = I18N;