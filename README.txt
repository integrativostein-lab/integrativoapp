 🌿 INTEGRATIVO.APP — README
=====================================

📱 ACESSO AO SISTEMA
-------------------------------------
Frontend: https://integra-saude-psi.vercel.app
Backend:  https://integra-backend-ynrd.onrender.com

👥 CONTAS DE DEMONSTRAÇÃO
-------------------------------------
Profissional: profissional@demo.com   / demo123
Paciente:     paciente@demo.com       / demo123

📁 ESTRUTURA DE PASTAS
-------------------------------------
saude-integrativa/
├── frontend/          (HTML, CSS, JS — Vercel)
├── backend/           (Node.js, API — Render)
│   ├── rotas/         (Rotas da API)
│   └── servicos/      (Fornecedores, email, etc.)
├── shared/            (JSON compartilhado front/back)
└── docs/              (Documentação)

🗄️ BANCO DE DADOS — POSTGRESQL (SUPABASE)
-------------------------------------
O sistema NÃO utiliza SQLite. Persistência via PostgreSQL (driver pg),
conectado por DATABASE_URL no backend (Render). Produção: Supabase.
Migrações: migracao-v2.1.sql · Setup local: SETUP_LOCAL_SUPABASE.md

📚 Catálogo dinâmico (61 especialidades · 79 bibliotecas · ~1191 registros — atualize com npm run catalogo:sync)
-------------------------------------
Fitoterapia, Ayurveda, MTC, Yoga, Massoterapia,
Aromaterapia, Fisioterapia, Xamanismo, Florais de Bach,
Reiki, Reflexologia, Medicina Integrativa, Jyotish,
Vastu Shastra, Quiropraxia, Osteopatia, Cromoterapia,
Musicoterapia, Equoterapia, Apiterapia, Hidroterapia,
Acupuntura, Medicina Tradicional, Farmacologia,
Pediatria, Ginecologia, Geriatria, Saúde Mental,
Medicina de Família, Emergência

📧 CONTATO
-------------------------------------
Suporte: suporte@integrativo.app