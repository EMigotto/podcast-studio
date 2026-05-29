# Sync·MI — Pacote completo da aplicação

App single-file React (`index.html`) + funções serverless em `api/`. Sem framework, sem build pipeline, sem npm install. O Vercel só precisa servir o `index.html` e expor as funções de `api/`.

## ⚠️ Antes de subir — leia se você teve erro de build

Se você está vendo erros tipo:

```
./app/login/page.tsx
Module not found: Can't resolve '@/lib/supabase/client'
```

… significa que **o repositório `podcast-studio` ainda tem arquivos de outro projeto antigo** (ex.: `squad-autonomo` em Next.js). O Vercel detectou o `package.json` daquele projeto, tentou rodar `next build`, e quebrou. Não é problema do Sync·MI — é poluição do repo.

### Como limpar (uma vez, no seu Git local):

```bash
git clone https://github.com/EMigotto/podcast-studio.git
cd podcast-studio

# 1) APAGUE TUDO do repo, exceto a pasta .git
find . -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +

# 2) Descompacte os arquivos deste zip aqui
#    (resultado: index.html, api/, vercel.json, package.json, etc. na raiz)

# 3) Commit limpo
git add -A
git commit -m "Sync·MI: clean slate deploy"
git push origin main
```

Após o push, o Vercel vai rebuild automático. Como o `package.json` agora é o nosso (sem Next.js) e o `vercel.json` força `framework: null` + comandos de build no-op, **vai dar deploy estático sem rodar build algum**.

## Estrutura mínima do repo (após limpeza)

```
/
├── index.html            ← a aplicação inteira (SPA single-file)
├── api/
│   ├── config.js         ← expõe SUPABASE_URL + anon key
│   ├── share.js          ← preview de link
│   └── send-episode.js   ← envio de episódio aos inscritos
├── vercel.json           ← força framework:null + comandos no-op
├── package.json          ← marker mínimo, sem deps, sem build
├── .vercelignore         ← exclui restos de frameworks antigos
├── setup-supabase.sql    ← schema do Supabase (tabelas + RLS + bucket)
├── SETUP.md              ← documentação completa
└── README.md             ← este arquivo
```

Qualquer arquivo fora dessa lista (especialmente `app/`, `src/`, `lib/`, `next.config.js`, etc.) **deve ser removido**.

## Como substituir a aplicação

1. **Limpe o repo** (instruções acima) — passo crítico se você teve erro de build.
2. **Suba todos os arquivos deste zip** na raiz, preservando a pasta `api/`.
3. Rode o `setup-supabase.sql` no SQL Editor do Supabase (idempotente — pode rodar de novo sem problema; cria/atualiza tabelas, RLS, bucket `media` e a nova tabela `learnings`).
4. Confirme as **Environment Variables** no Vercel (Production):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (públicas)
   - `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (para envio de email)
   - `ANTHROPIC_API_KEY` (para os recursos de IA no admin, incluindo Learning de Inovação)
5. **Redeploy** no Vercel.

## O que está nesta versão

- **Aba Learning de Inovação** no admin: pesquisa em fontes com IA, 5 sessões editáveis (Conceito / Por que importa / Na prática / Próximas ações / FAQ), KPIs, gráfico, fontes, chat de refinamento, HTML standalone exportável e teasers para Instagram/LinkedIn.
- **Capítulo 03 da landing** puxa os Learnings reais do banco; clicar abre o HTML completo numa nova aba.
- Landing no modelo Floema (4 capítulos numerados com cores próprias e imagens de fundo temáticas).
- Animações: rede de partículas no hero, GSAP ScrollTrigger nos capítulos, marquee em loop, CTAs magnéticas, hover-to-play nos vídeos do carrossel.
- Logo SVG animado (`<Logo>`) sincronizando em todas as páginas.
- Sistema de inscrição com Resend + tracking de aberturas.
- Upload de vídeo até 300MB via TUS (Supabase Storage).

Detalhes operacionais (Resend, domínio verificado, limites, etc.) no `SETUP.md`.

Os arquivos `tema-*.html` na raiz do output são apenas demos de exploração de design — **não fazem parte do deploy**.
