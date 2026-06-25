const I18N = {
  currentLang: 'pt-BR',
  availableLangs: ['pt-BR', 'es', 'zh', 'ru', 'hi', 'en', 'ar', 'fa', 'id', 'ja', 'ko', 'af', 'zu', 'fr'],
  rtlLangs: ['ar', 'fa'],
  bandeiras: {
    'pt-BR': '🇧🇷',
    es: '🇲🇽',
    en: '🇺🇸',
    zh: '🇨🇳',
    ru: '🇷🇺',
    hi: '🇮🇳',
    ar: '🇪🇬',
    fa: '🇮🇷',
    id: '🇮🇩',
    ja: '🇯🇵',
    ko: '🇰🇷',
    af: '🇿🇦',
    zu: '🇿🇦',
    fr: '🇫🇷'
  },
  isoPaises: {
    'pt-BR': 'br', es: 'mx', en: 'us', zh: 'cn', ru: 'ru', hi: 'in',
    ar: 'eg', fa: 'ir', id: 'id', ja: 'jp', ko: 'kr',
    af: 'za', zu: 'za', fr: 'fr'
  },
  rotulos: {
    'pt-BR': 'PT', es: 'ES', en: 'EN', zh: 'ZH', ru: 'RU', hi: 'HI',
    ar: 'AR', fa: 'FA', id: 'ID', ja: 'JA', ko: 'KO',
    af: 'AF', zu: 'ZU', fr: 'FR'
  },
  nomesIdiomas: {
    'pt-BR': 'Português',
    es: 'Español',
    en: 'English',
    zh: '中文',
    ru: 'Русский',
    hi: 'हिन्दी',
    ar: 'العربية',
    fa: 'فارسی',
    id: 'Indonesia',
    ja: '日本語',
    ko: '한국어',
    af: 'Afrikaans',
    zu: 'isiZulu',
    fr: 'Français'
  },

  translations: {
    'pt-BR': {
      'hero.titulo': 'Saúde integrativa com quem entende do assunto',
      'hero.subtitulo': '{{especialidades}} especialidades e {{bibliotecas}} bibliotecas terapêuticas — teleconsulta ou presencial, com respaldo de fontes oficiais.',
      'hero.buscar': '🔍 Buscar profissional',
      'hero.profissional': '📋 Sou profissional de saúde',
      'hero.baixar_app': '📱 Instalar app grátis',
      'hero.nota': 'Anamnese clínica integrativa (PICS + medicina ocidental), autocuidado orientado e profissionais em Ayurveda, fitoterapia, MTC, yoga e mais.',
      'home.credito': '<strong>Conteúdo curado com referências reconhecidas em saúde</strong> — para apoiar decisão clínica responsável, nunca substituir avaliação profissional.',
      'home.pwa.badge': 'Instalação direta pelo site',
      'home.pwa.titulo': '📱 Leve o Integrativo.App no bolso',
      'home.pwa.texto': 'Instale direto pelo site — <strong>sem Play Store ou App Store</strong> (PWA). O ícone fica na tela inicial e abre em tela cheia: busca de profissionais, conta e consultas na palma da mão.',
      'home.diferenciais.titulo': 'O que você encontra no Integrativo.App',
      'home.diferenciais.sub': 'Tecnologia para quem busca cuidado integrativo de qualidade — e para quem profissionalmente entrega esse cuidado.',
      'home.card.bibliotecas': 'Protocolos, fitoterapia, PICS e bases clínicas com PNPIC/MS, OMS, ANVISA, NCCIH, Cochrane e textos clássicos.',
      'home.card.tele.titulo': 'Teleconsulta segura',
      'home.card.tele.texto': 'Atendimento online com registro no prontuário, anamnese prévia estruturada e continuidade entre consultas presenciais e remotas.',
      'home.card.anamnese.titulo': 'Anamnese integrativa',
      'home.card.anamnese.texto': 'Formulário clínico com queixa, hábitos, autocuidado, PICS e medicina ocidental — o paciente chega preparado; o profissional ganha tempo na consulta.',
      'home.card.fhir.titulo': 'Prontuário interoperável',
      'home.card.fhir.texto': 'Para profissionais: exportação HL7 FHIR, preparação TISS/ANS e histórico estruturado para redes de saúde e operadoras.',
      'home.card.lgpd.titulo': 'Privacidade e LGPD',
      'home.card.lgpd.texto': 'Dados sensíveis de saúde com consentimento informado, auditoria de acesso e transparência sobre cada finalidade de uso.',
      'home.stat.especialidades': 'Especialidades para busca',
      'home.stat.bibliotecas': 'Bibliotecas terapêuticas',
      'home.stat.registros': 'Registros de conhecimento',
      'home.stat.fontes': 'Fontes oficiais indexadas',
      'home.ods.titulo': '🌍 Compromisso com saúde sustentável e equidade',
      'home.ods.texto': 'Alinhamos nossa missão aos ODS 3 (saúde), 4 (educação), 8 (trabalho digno), 9 (inovação), 10 (redução de desigualdades), 13 (clima), 15 (vida terrestre), 16 (instituições) e 17 (parcerias). Referência institucional — não constitui certificação ou endosso oficial da ONU.',
      'home.banner.titulo': '🚀 Você cuida de pessoas. A gente cuida da tecnologia.',
      'home.banner.cta': 'Começar gratuitamente',
      'nav.inicio': 'Início',
      'nav.busca': 'Busca',
      'nav.profissionais': 'Sou Profissional',
      'nav.bibliotecas': 'Bibliotecas',
      'nav.entrar': 'Entrar',
      'nav.planos': 'Planos',
      'nav.comparativo': 'Comparativo',
      'nav.cadastro': 'Cadastro',
      'nav.mapa_especialidades': 'Conteúdo por especialidade',
      'footer.direitos': '🌿 Integrativo.App — Saúde Integrativa',
      'lang.seletor': 'Idioma'
    },
    en: {
      'hero.titulo': 'Find your integrative professional',
      'hero.subtitulo': '{{especialidades}} specialties. Book online or in-person.',
      'hero.buscar': '🔍 Find Professionals',
      'hero.profissional': '📋 I\'m a Professional',
      'hero.baixar_app': '📱 Download Free App',
      'hero.nota': 'Integrative clinical intake (complementary practices + conventional medicine), guided self-care, and professionals in Ayurveda, herbal medicine, TCM, yoga, and more.',
      'nav.inicio': 'Home',
      'nav.busca': 'Search',
      'nav.profissionais': 'I\'m a Professional',
      'nav.bibliotecas': 'Libraries',
      'nav.entrar': 'Login',
      'nav.planos': 'Plans',
      'nav.comparativo': 'Comparison',
      'nav.cadastro': 'Sign up',
      'nav.mapa_especialidades': 'Content by specialty',
      'footer.direitos': '🌿 Integrativo.App — Integrative Health',
      'lang.seletor': 'Language'
    },
    es: {
      'hero.titulo': 'Encuentra a tu profesional de salud integrativa',
      'hero.subtitulo': '{{especialidades}} especialidades. Agenda en línea o presencial.',
      'hero.buscar': '🔍 Buscar profesionales',
      'hero.profissional': '📋 Soy Profesional',
      'hero.baixar_app': '📱 Descarga la app gratis',
      'nav.inicio': 'Inicio',
      'nav.busca': 'Búsqueda',
      'nav.profissionais': 'Soy Profesional',
      'nav.bibliotecas': 'Bibliotecas',
      'nav.entrar': 'Ingresar',
      'nav.planos': 'Planes',
      'nav.cadastro': 'Registro',
      'footer.direitos': '🌿 Integrativo.App — Salud integrativa',
      'lang.seletor': 'Idioma'
    },
    fr: {
      'hero.titulo': 'Trouvez votre professionnel intégratif',
      'hero.subtitulo': '{{especialidades}} spécialités. Réservez en ligne ou en personne.',
      'hero.buscar': 'Chercher des Professionnels',
      'hero.baixar_app': '📱 Téléchargez l\'App Gratuitement',
      'nav.inicio': 'Accueil',
      'nav.busca': 'Recherche',
      'nav.profissionais': 'Je suis professionnel',
      'nav.bibliotecas': 'Bibliothèques',
      'nav.entrar': 'Connexion',
      'nav.planos': 'Plans',
      'nav.cadastro': 'Inscription',
      'footer.direitos': '🌿 Integrativo.App — Santé Intégrative',
      'lang.seletor': 'Langue'
    },
    ru: {
      'hero.titulo': 'Найдите своего интегративного специалиста',
      'hero.subtitulo': '{{especialidades}} специальностей. Запись онлайн или лично.',
      'hero.buscar': 'Найти специалистов',
      'hero.baixar_app': '📱 Скачать приложение бесплатно',
      'nav.inicio': 'Главная',
      'nav.busca': 'Поиск',
      'nav.profissionais': 'Я специалист',
      'nav.bibliotecas': 'Библиотеки',
      'nav.entrar': 'Вход',
      'nav.planos': 'Планы',
      'nav.cadastro': 'Регистрация',
      'footer.direitos': '🌿 Integrativo.App — Интегративное здоровье',
      'lang.seletor': 'Язык'
    },
    hi: {
      'hero.titulo': 'अपने एकीकृत पेशेवर खोजें',
      'hero.subtitulo': '{{especialidades}} विशेषताएँ। ऑनलाइन या व्यक्तिगत रूप से बुक करें।',
      'hero.buscar': 'पेशेवर खोजें',
      'hero.baixar_app': '📱 मुफ्त ऐप डाउनलोड करें',
      'nav.inicio': 'होम',
      'nav.busca': 'खोज',
      'nav.profissionais': 'मैं पेशेवर हूँ',
      'nav.bibliotecas': 'पुस्तकालय',
      'nav.entrar': 'लॉगिन',
      'nav.planos': 'योजनाएं',
      'nav.cadastro': 'पंजीकरण',
      'footer.direitos': '🌿 Integrativo.App — एकीकृत स्वास्थ्य',
      'lang.seletor': 'भाषा'
    },
    zh: {
      'hero.titulo': '寻找您的综合健康专业人士',
      'hero.subtitulo': '{{especialidades}}个专业。在线或亲自预约。',
      'hero.buscar': '寻找专业人士',
      'hero.baixar_app': '📱 免费下载应用',
      'nav.inicio': '首页',
      'nav.busca': '搜索',
      'nav.profissionais': '我是专业人士',
      'nav.bibliotecas': '资料库',
      'nav.entrar': '登录',
      'nav.planos': '方案',
      'nav.cadastro': '注册',
      'footer.direitos': '🌿 Integrativo.App — 综合健康',
      'lang.seletor': '语言'
    },
    af: {
      'hero.titulo': 'Vind jou integrerende professioneel',
      'hero.subtitulo': '{{especialidades}} spesialiteite. Bespreek aanlyn of persoonlik.',
      'hero.buscar': 'Soek Professionele',
      'hero.baixar_app': '📱 Laai die App gratis af',
      'nav.inicio': 'Tuis',
      'nav.busca': 'Soek',
      'nav.profissionais': 'Ek is professioneel',
      'nav.bibliotecas': 'Biblioteke',
      'nav.entrar': 'Teken in',
      'nav.planos': 'Planne',
      'nav.cadastro': 'Registrasie',
      'footer.direitos': '🌿 Integrativo.App — Integrerende Gesondheid',
      'lang.seletor': 'Taal'
    },
    zu: {
      'hero.titulo': 'Thola uchwepheshe wakho wezempilo',
      'hero.subtitulo': 'Izinhlobo ezingama-{{especialidades}}. Bhukha ku-inthanethi noma ngokuqondene.',
      'hero.buscar': 'Thola Ochwepheshe',
      'hero.baixar_app': '📱 Landa uhlelo lokusebenza mahhala',
      'nav.inicio': 'Ikhaya',
      'nav.busca': 'Sesha',
      'nav.profissionais': 'Ngiyisichwepheshe',
      'nav.bibliotecas': 'Amathala',
      'nav.entrar': 'Ngena',
      'nav.planos': 'Izinhlelo',
      'nav.cadastro': 'Bhalisa',
      'footer.direitos': '🌿 Integrativo.App — Impilo Ehlanganisiwe',
      'lang.seletor': 'Ulimi'
    },
    ar: {
      'hero.titulo': 'اعثر على أخصائي الصحة التكاملية',
      'hero.subtitulo': '{{especialidades}} تخصصات. احجز عبر الإنترنت أو حضورياً.',
      'hero.buscar': 'البحث عن المختصين',
      'hero.baixar_app': '📱 حمّل التطبيق مجاناً',
      'nav.inicio': 'الرئيسية',
      'nav.busca': 'بحث',
      'nav.profissionais': 'أنا مختص',
      'nav.bibliotecas': 'المكتبات',
      'nav.entrar': 'دخول',
      'nav.planos': 'الخطط',
      'nav.cadastro': 'التسجيل',
      'footer.direitos': '🌿 Integrativo.App — الصحة التكاملية',
      'lang.seletor': 'اللغة'
    },
    fa: {
      'hero.titulo': 'متخصص سلامت یکپارچه خود را پیدا کنید',
      'hero.subtitulo': '{{especialidades}} تخصص. آنلاین یا حضوری رزرو کنید.',
      'hero.buscar': 'جستجوی متخصصان',
      'hero.baixar_app': '📱 اپلیکیشن رایگان را دانلود کنید',
      'nav.inicio': 'خانه',
      'nav.busca': 'جستجو',
      'nav.profissionais': 'من متخصص هستم',
      'nav.bibliotecas': 'کتابخانه‌ها',
      'nav.entrar': 'ورود',
      'nav.planos': 'طرح‌ها',
      'nav.cadastro': 'ثبت‌نام',
      'footer.direitos': '🌿 Integrativo.App — سلامت یکپارچه',
      'lang.seletor': 'زبان'
    },
    id: {
      'hero.titulo': 'Temukan profesional kesehatan integratif Anda',
      'hero.subtitulo': '{{especialidades}} spesialisasi. Pesan online atau tatap muka.',
      'hero.buscar': 'Cari Profesional',
      'hero.baixar_app': '📱 Unduh Aplikasi Gratis',
      'nav.inicio': 'Beranda',
      'nav.busca': 'Pencarian',
      'nav.profissionais': 'Saya Profesional',
      'nav.bibliotecas': 'Perpustakaan',
      'nav.entrar': 'Masuk',
      'nav.planos': 'Paket',
      'nav.cadastro': 'Daftar',
      'footer.direitos': '🌿 Integrativo.App — Kesehatan Integratif',
      'lang.seletor': 'Bahasa'
    },
    ja: {
      'hero.titulo': '統合医療の専門家を見つける',
      'hero.subtitulo': '{{especialidades}}の専門分野。オンラインまたは対面で予約。',
      'hero.buscar': '専門家を検索',
      'hero.baixar_app': '📱 無料アプリをダウンロード',
      'nav.inicio': 'ホーム',
      'nav.busca': '検索',
      'nav.profissionais': '私は専門家です',
      'nav.bibliotecas': 'ライブラリ',
      'nav.entrar': 'ログイン',
      'nav.planos': 'プラン',
      'nav.cadastro': '登録',
      'footer.direitos': '🌿 Integrativo.App — 統合医療',
      'lang.seletor': '言語'
    },
    ko: {
      'hero.titulo': '통합 건강 전문가를 찾아보세요',
      'hero.subtitulo': '{{especialidades}}개 전문 분야. 온라인 또는 대면 예약.',
      'hero.buscar': '전문가 검색',
      'hero.baixar_app': '📱 무료 앱 다운로드',
      'nav.inicio': '홈',
      'nav.busca': '검색',
      'nav.profissionais': '전문가입니다',
      'nav.bibliotecas': '라이브러리',
      'nav.entrar': '로그인',
      'nav.planos': '요금제',
      'nav.cadastro': '회원가입',
      'footer.direitos': '🌿 Integrativo.App — 통합 건강',
      'lang.seletor': '언어'
    }
  },

  syncFromConfig() {
    if (window.CONFIG?.IDIOMAS?.length) {
      this.availableLangs = CONFIG.IDIOMAS.slice();
    }
    if (window.CONFIG?.IDIOMAS_BANDEIRAS) {
      this.bandeiras = { ...this.bandeiras, ...CONFIG.IDIOMAS_BANDEIRAS };
    }
    if (window.CONFIG?.IDIOMAS_ISO) {
      this.isoPaises = { ...this.isoPaises, ...CONFIG.IDIOMAS_ISO };
    }
    if (window.CONFIG?.IDIOMAS_ROTULOS) {
      this.rotulos = { ...this.rotulos, ...CONFIG.IDIOMAS_ROTULOS };
    }
    if (window.CONFIG?.IDIOMAS_RTL?.length) {
      this.rtlLangs = CONFIG.IDIOMAS_RTL.slice();
    }
  },

  isoIdioma(lang) {
    return this.isoPaises[lang] || String(lang || '').slice(0, 2).toLowerCase();
  },

  urlBandeira(lang) {
    return `img/bandeiras/${this.isoIdioma(lang)}.svg`;
  },

  htmlBandeiraIdioma(lang) {
    const rotulo = this.rotulos[lang] || lang;
    return `<img class="lang-flag" src="${this.urlBandeira(lang)}" alt="" width="20" height="14" loading="lazy"><span class="lang-label">${rotulo}</span>`;
  },

  nomeIdioma(lang) {
    return this.nomesIdiomas[lang] || lang;
  },

  montarSeletorDropdown(container, wrapperClass) {
    container.innerHTML = '';
    container.setAttribute('data-i18n-no-translate', 'true');
    if (wrapperClass) container.className = wrapperClass;

    const wrap = document.createElement('div');
    wrap.className = 'nav-lang-select-wrap';

    const flag = document.createElement('img');
    flag.className = 'lang-flag lang-flag-select';
    flag.src = this.urlBandeira(this.currentLang);
    flag.alt = '';
    flag.width = 20;
    flag.height = 14;

    const select = document.createElement('select');
    select.className = 'nav-lang-select';
    select.setAttribute('aria-label', this.t('lang.seletor'));

    this.availableLangs.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = `${this.rotulos[lang] || lang} · ${this.nomeIdioma(lang)}`;
      if (lang === this.currentLang) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      this.setLanguage(select.value, true);
      flag.src = this.urlBandeira(select.value);
    });

    wrap.appendChild(flag);
    wrap.appendChild(select);
    container.appendChild(wrap);
  },

  getLocale() {
    return this.currentLang;
  },

  getIntlLocale() {
    const map = {
      'pt-BR': 'pt-BR',
      es: 'es-419',
      en: 'en-US',
      zh: 'zh-CN',
      ru: 'ru-RU',
      hi: 'hi-IN',
      ar: 'ar-EG',
      fa: 'fa-IR',
      id: 'id-ID',
      ja: 'ja-JP',
      ko: 'ko-KR',
      af: 'af-ZA',
      zu: 'zu-ZA',
      fr: 'fr-FR'
    };
    return map[this.currentLang] || this.currentLang;
  },

  mapLocale(raw) {
    if (!raw) return null;
    const tag = String(raw).trim().replace(/_/g, '-');
    const lower = tag.toLowerCase();
    const primary = lower.split('-')[0];

    if (primary === 'es') return 'es';
    if (primary === 'pt') return 'pt-BR';
    if (primary === 'en') return 'en';
    if (primary === 'zh') return 'zh';
    if (primary === 'ar') return 'ar';
    if (primary === 'fa') return 'fa';
    if (primary === 'id') return 'id';
    if (primary === 'ja') return 'ja';
    if (primary === 'ko') return 'ko';
    if (primary === 'ru') return 'ru';
    if (primary === 'hi') return 'hi';
    if (primary === 'fr') return 'fr';
    if (primary === 'af') return 'af';
    if (primary === 'zu') return 'zu';

    const exact = {
      'pt-br': 'pt-BR',
      'es-419': 'es',
      'es-mx': 'es',
      'es-ar': 'es',
      'es-co': 'es',
      'es-cl': 'es',
      'es-pe': 'es',
      'es-ve': 'es',
      'es-ec': 'es',
      'es-bo': 'es',
      'es-py': 'es',
      'es-uy': 'es',
      'es-cr': 'es',
      'es-pa': 'es',
      'es-do': 'es',
      'es-gt': 'es',
      'es-hn': 'es',
      'es-ni': 'es',
      'es-sv': 'es',
      'es-pr': 'es',
      'en-us': 'en',
      'en-gb': 'en',
      'en-in': 'en',
      'en-za': 'en',
      'zh-cn': 'zh',
      'zh-hans': 'zh',
      'zh-hant': 'zh',
      'zh-tw': 'zh',
      'zh-hk': 'zh',
      'ru-ru': 'ru',
      'hi-in': 'hi',
      'ar-eg': 'ar',
      'ar-ae': 'ar',
      'ar-sa': 'ar',
      'fa-ir': 'fa',
      'id-id': 'id',
      'ja-jp': 'ja',
      'ko-kr': 'ko',
      fr: 'fr',
      'fr-fr': 'fr'
    };

    if (exact[lower]) return exact[lower];
    if (exact[primary]) return exact[primary];

    return this.availableLangs.find((lang) => lang.toLowerCase() === lower)
      || this.availableLangs.find((lang) => lang.toLowerCase().startsWith(primary))
      || null;
  },

  getSystemLanguages() {
    const lista = [];
    if (Array.isArray(navigator.languages)) {
      lista.push(...navigator.languages);
    }
    if (navigator.language) lista.push(navigator.language);
    if (navigator.userLanguage) lista.push(navigator.userLanguage);
    return [...new Set(lista.filter(Boolean))];
  },

  detectLanguage() {
    this.syncFromConfig();

    const manual = localStorage.getItem('integra_lang_manual') === 'true';
    const saved = localStorage.getItem('integra_lang');

    if (manual && saved && this.availableLangs.includes(saved)) {
      return saved;
    }

    for (const candidato of this.getSystemLanguages()) {
      const mapped = this.mapLocale(candidato);
      if (mapped && this.availableLangs.includes(mapped)) {
        localStorage.setItem('integra_lang', mapped);
        localStorage.setItem('integra_lang_manual', 'false');
        return mapped;
      }
    }

    if (saved && this.availableLangs.includes(saved)) {
      return saved;
    }

    return 'pt-BR';
  },

  t(key) {
    const lang = this.currentLang;
    let text = this.translations[lang]?.[key]
      || this.translations.en?.[key]
      || this.translations['pt-BR']?.[key]
      || key;

    if (window.CONFIG?.Catalogo?.substituirTokens) {
      text = CONFIG.Catalogo.substituirTokens(text, CONFIG);
    }
    return text;
  },

  setLanguage(lang, manual = true) {
    if (!this.availableLangs.includes(lang)) return;
    this.currentLang = lang;
    localStorage.setItem('integra_lang', lang);
    localStorage.setItem('integra_lang_manual', manual ? 'true' : 'false');
    this.aplicarIdiomaDocumento();
    if (window.NavPublico?.init) window.NavPublico.init();
    else {
      this.aplicarTraducoes();
      this.montarSeletorIdioma();
    }
    this.executarTraducaoCompleta();
  },

  async executarTraducaoCompleta() {
    this.aplicarTraducoes();
    await this.garantirAutoTraducao();
    if (window.I18NAuto?.aplicar) {
      await window.I18NAuto.aplicar(this);
    } else if (window.CONFIG?.Catalogo?.iniciarPagina) {
      window.CONFIG.Catalogo.iniciarPagina(window.CONFIG);
    }
    this.atualizarSeletorIdioma();
  },

  garantirAutoTraducao() {
    if (window.I18NAuto) return Promise.resolve();
    return new Promise((resolve) => {
      const ref = document.querySelector('script[src*="i18n.js"]');
      const base = ref?.src.replace(/i18n\.js(\?.*)?$/, '') || 'js/';
      const s = document.createElement('script');
      s.src = `${base}i18n-auto.js`;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  },

  aplicarIdiomaDocumento() {
    document.documentElement.lang = this.getIntlLocale();
    document.documentElement.setAttribute('data-integra-lang', this.currentLang);
    document.documentElement.dir = this.rtlLangs.includes(this.currentLang) ? 'rtl' : 'ltr';
  },

  async init() {
    this.syncFromConfig();
    this.currentLang = this.detectLanguage();
    this.aplicarIdiomaDocumento();
    if (window.NavPublico?.init) window.NavPublico.init();
    else {
      this.aplicarTraducoes();
      this.montarSeletorIdioma();
    }
    await this.executarTraducaoCompleta();
  },

  aplicarTraducoes() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const usarHtml = el.hasAttribute('data-i18n-html');
      const texto = this.t(key);
      if (attr) {
        el.setAttribute(attr, texto);
      } else if (usarHtml) {
        el.innerHTML = texto;
      } else {
        el.textContent = texto;
      }
    });
  },

  montarSeletorIdioma() {
    const navAlvo = document.getElementById('nav-lang-selector');
    if (navAlvo) {
      this.montarSeletorDropdown(navAlvo, 'nav-lang-select-container');
      return;
    }

    let flutuante = document.getElementById('lang-selector');
    if (!flutuante) {
      flutuante = document.createElement('div');
      flutuante.id = 'lang-selector';
      flutuante.setAttribute('data-i18n-no-translate', 'true');
      document.body.appendChild(flutuante);
    }

    flutuante.className = 'lang-selector-flutuante';
    flutuante.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      background: rgba(255,255,255,0.96); padding: 6px 10px;
      border-radius: 999px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    `;
    this.montarSeletorDropdown(flutuante, 'lang-selector-flutuante');
  },

  criarSeletorIdioma() {
    this.montarSeletorIdioma();
  },

  atualizarSeletorIdioma() {
    document.querySelectorAll('.nav-lang-select').forEach((select) => {
      if (select.querySelector(`option[value="${this.currentLang}"]`)) {
        select.value = this.currentLang;
      }
    });
    document.querySelectorAll('.lang-flag-select').forEach((img) => {
      img.src = this.urlBandeira(this.currentLang);
    });
  }
};

function iniciarI18n() {
  if (window.CONFIG) I18N.syncFromConfig();
  if (!window.__integraCatalogoI18nSync) {
    window.__integraCatalogoI18nSync = true;
    document.addEventListener('catalogo:atualizado', () => {
      I18N.aplicarTraducoes();
      if (window.CONFIG?.Catalogo?.aplicarTokensDocumento) {
        window.CONFIG.Catalogo.aplicarTokensDocumento(window.CONFIG);
      }
    });
  }
  I18N.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => iniciarI18n());
} else {
  iniciarI18n();
}

window.I18N = I18N;
