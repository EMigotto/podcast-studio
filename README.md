# Sync·MI — Pacote completo da aplicação

Versão com a landing e as páginas públicas (newsletter do episódio, galeria de
podcasts e detalhe do episódio) no sistema de design **Cupertino / Ive**:
scroll cinematográfico, carrosséis de dados reais, tipografia Instrument Serif,
seções claro/escuro e movimento ligado ao scroll.

## Estrutura do pacote

```
/
├── index.html            ← a aplicação inteira (SPA)
├── api/
│   ├── config.js         ← expõe SUPABASE_URL + anon key (lê env vars no servidor)
│   ├── share.js          ← preview rico de link (LinkedIn/Facebook/X/WhatsApp)
│   └── send-episode.js   ← envia o episódio por email aos inscritos (Resend)
├── vercel.json           ← rota /share/:date + maxDuration das funções
├── setup-supabase.sql    ← cria todas as tabelas + RLS + bucket de Storage
└── SETUP.md              ← documentação completa de setup
```

> `og-default.png` (1200×630) é opcional — coloque na raiz para o preview de link
> ter uma imagem padrão da marca quando o episódio não tiver infográfico.

## Como substituir a aplicação inteira

1. **Suba estes arquivos na raiz do repositório** (substituindo os antigos),
   mantendo a pasta `api/` exatamente como está.
2. Rode o `setup-supabase.sql` no SQL Editor do Supabase (é idempotente — pode
   rodar de novo sem problema; cria/atualiza tabelas, RLS e o bucket `media`).
3. Confirme as **Environment Variables** no Vercel (Production):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (públicas)
   - `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (para o envio de email)
   - `ANTHROPIC_API_KEY` (se usar os recursos de IA no admin)
4. **Redeploy** no Vercel.

Detalhes de cada passo (Resend, domínio verificado, limites de upload, etc.)
estão no `SETUP.md`.

## O que mudou nesta versão

- **Landing** reconstruída no estilo Ive: hero fixado que escala no scroll,
  frase revelada palavra por palavra, seção "Por quê / Wellness", carrosséis
  reais de Podcast e Newsletter, seção "Learning de Inovação", parallax.
- **Página pública do episódio** (`?view=public`): cabeçalho Instrument Serif,
  reveal no scroll, cross-sell do podcast em faixa escura.
- **Galeria de Podcasts** (`?view=podcasts`) e **detalhe** (`?view=podcast`):
  títulos e hero no novo sistema tipográfico.
- Sistema de design global (`.lp-*`, tokens, Instrument Serif) disponível para
  o app inteiro.

Os arquivos `tema-*.html` são as 4 demos de design (exploração) — **não fazem
parte do deploy**, são só referência.
