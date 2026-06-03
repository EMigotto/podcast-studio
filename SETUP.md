# Sync·MI · v13 — Newsletter (Wizard) + Podcast Semanal

Newsletter de texto diário **separada** do Podcast Semanal em vídeo (HeyGen).
Single-file HTML + React 18 (UMD) + Supabase.

---

## O que mudou no v13

1. **Landing com duas seções claras**: Newsletter Diária + Podcast Semanal, com texto reforçando "perdeu a semana? assista em 5 min e entenda os principais temas com exemplos práticos"
2. **Newsletter virou Wizard de 6 passos** — fluxo guiado, cada passo confirma antes de avançar
3. **Novo módulo Podcast Semanal** — gera roteiro com cenas + reações pronto pro HeyGen, consome múltiplas newsletters como base
4. **Página pública de podcasts estilo YouTube** — `?view=podcasts` (galeria) e `?view=podcast&id=...` (detalhe com player + sidebar)
5. **Fontes pesquisadas armazenadas pra sempre** na newsletter (campo `sourceCandidates`) — reaproveitáveis em buscas futuras
6. **Tradução automática EN→PT** no Passo 1, com chip indicador "🇺🇸→🇧🇷 traduzido"
7. **Briefing IA virou Passo 5 do wizard** (não é mais aba separada)
8. **Tom obrigatório**: "DIRETO, SIMPLES, ENTUSIASTA com EXEMPLOS CLAROS" passa pra Anthropic na geração do resumo e do roteiro

---

## Setup (mesmo de antes)

1. Crie projeto Supabase, copie URL + anon key
2. Cole nas linhas 4-5 do `index.html`:
   ```js
   const SUPABASE_URL = "https://...";
   const SUPABASE_ANON_KEY = "eyJ...";
   ```
3. Rode `setup-supabase.sql` no SQL Editor (cria 10 tabelas com RLS + **bucket `media` no Storage**)
4. Crie usuário em Authentication → Users (`emigotto@syncronize-mi.local` / `Migotto1` / ✅ Auto Confirm)
5. Sobe no GitHub, Vercel redeploya

---

## Estrutura de deploy (v14 — Divulgação + preview de link)

A partir desta versão o projeto **não é mais um único arquivo**. A raiz do repositório deve ter:

```
/
├── index.html        ← o app (SPA) — busca a config de /api/config no boot
├── api/
│   ├── config.js       ← devolve SUPABASE_URL + anon key (lidos das env vars do Vercel)
│   ├── share.js        ← preview de link rico (LinkedIn/Facebook/X/WhatsApp)
│   └── send-episode.js ← envia o episódio por email aos inscritos (Resend)
├── vercel.json       ← rota /share/:date + config das funções
└── og-default.png    ← (opcional) imagem 1200×630 de fallback do preview
```

O Vercel detecta a pasta `api/` automaticamente e publica as três funções — não precisa configurar nada além das env vars abaixo.

### Por que o index.html precisa de /api/config

Arquivos estáticos servidos ao navegador **não enxergam** as env vars do Vercel — `process.env` não existe no browser, e não há build step que substitua valores. Então o `index.html` faz um fetch para `/api/config` no boot; essa função lê `process.env.SUPABASE_URL` / `process.env.SUPABASE_ANON_KEY` **no servidor** e devolve via JSON. O app só cria o cliente Supabase depois disso.

> A anon key é **pública por design** (feita pra ir no código do cliente, protegida por RLS) — então devolvê-la via `/api/config` é tão seguro quanto hardcodar, só que agora ela mora apenas nas env vars do Vercel, fora do repositório.
>
> **Fallback local**: se quiser abrir o `index.html` direto (sem o `/api`), preencha os `let SUPABASE_URL`/`SUPABASE_ANON_KEY` no topo do arquivo — eles são usados quando o `/api/config` não responde.

### Variáveis de ambiente no Vercel

Configure em **Vercel → Project → Settings → Environment Variables** (escopo **Production**, e Preview se quiser):

| Nome | Usada por | Valor | Secreto? |
|---|---|---|---|
| `SUPABASE_URL` | config, share, send-episode | `https://xxxx.supabase.co` | não |
| `SUPABASE_ANON_KEY` | config, share | `eyJ...` (anon key pública) | não |
| `SUPABASE_SERVICE_ROLE_KEY` | send-episode | `eyJ...` (Settings → API → **service_role**) | **SIM — nunca exponha** |
| `RESEND_API_KEY` | send-episode | `re_...` (resend.com → API Keys) | sim |
| `EMAIL_FROM` | send-episode | `Sync·MI <ola@seu-dominio.com>` (domínio verificado no Resend) | não |

> A anon key é pública por natureza (já vai no cliente). Já a **service_role key bypassa o RLS** — ela só vive no servidor (na função `send-episode`), nunca é devolvida pelo `/api/config` nem aparece no browser.

Depois de salvar/alterar qualquer env var, faça um **Redeploy** pra elas entrarem em vigor.

---

## Inscritos, Email e Audiência (v15)

### Como funciona o ciclo completo

1. **Inscrição**: o formulário da landing page grava o email na tabela `subscribers` (id = hash SHA-256 do email, então é idempotente e não expõe o email em URLs).
2. **Publicação**: ao publicar um episódio, ele ganha um `episodeCode` (gerado automático) e um `emailSubject` opcional (Passo 6). 
3. **Envio**: no Passo 6, o botão **"📨 Enviar episódio aos inscritos"** chama `/api/send-episode?date=...`, que monta um email (card no estilo dos posts do Instagram) com um **link único por inscrito**: `?view=public&date=DATE&ec=CODE&ref=REF`.
4. **Tracking**: quando o inscrito abre o link, a página pública detecta `ref` + `ec` e registra a abertura na tabela `opens` (idempotente por inscrito+episódio).
5. **Audiência**: a aba **📊 Audiência** mostra todos os inscritos, quantos emails cada um recebeu, e quais/quantos episódios cada um abriu — separando "telespectadores ativos" (que abriram ao menos 1) dos passivos.

### Setup do email (Resend)

1. Crie conta em [resend.com](https://resend.com) (free tier: 3.000 emails/mês, 100/dia)
2. **Verifique um domínio** (Domains → Add Domain → configure os registros DNS). Sem domínio verificado, só dá pra enviar do `onboarding@resend.dev` pra você mesmo.
3. Crie uma **API Key** → cole em `RESEND_API_KEY` no Vercel
4. Defina `EMAIL_FROM` com um remetente do domínio verificado (ex: `Sync·MI <ola@syncmi.com.br>`)
5. Pegue a **service_role key** (Supabase → Settings → API) → cole em `SUPABASE_SERVICE_ROLE_KEY` no Vercel
6. Redeploy

> Sem `RESEND_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, o botão de envio retorna um erro explicando o que falta — o resto do app (inscrição, tracking, audiência) funciona normalmente.

### Tabelas novas no Supabase

Rode o `setup-supabase.sql` atualizado — ele cria `subscribers`, `opens` e `email_logs` com RLS:
- **subscribers**: anon pode inserir/atualizar (inscrição), só o admin lê (emails não ficam públicos)
- **opens**: anon insere (registro de abertura), admin lê
- **email_logs**: gravado pela service_role na função, admin lê

---

### Imagem de fallback (`og-default.png`)

Pra links sem infográfico (ou a home), o preview usa `og-default.png` na raiz. Crie uma imagem **1200×630** com a marca Sync·MI e suba na raiz do repositório. Sem ela, o preview ainda funciona mas sem imagem padrão.

---

## Módulo Divulgação (aba 📣)

Nova aba no admin pra transformar um episódio em conteúdo social:

### Instagram
1. Selecione o episódio
2. Escolha o **tipo de post**: Capa (Ink/Paper/Accent), Quote Card, Dado em Destaque, Reels/Story 9:16, ou o Infográfico
3. O post renderiza com os dados reais do episódio no estilo editorial da marca
4. **⬇ Baixar PNG** — exporta em alta resolução (3×) via html2canvas, pronto pra postar
5. **✨ Gerar legenda** — a IA escreve a legenda com gancho + hashtags

### LinkedIn
1. **Preview do card** — mostra como o link vai aparecer no feed (usa o infográfico do episódio como imagem)
2. **✨ Gerar post** — a IA escreve um texto profissional e entusiasta, sucinto, com hashtags
3. **📋 Copiar post + link** — copia o texto já com o link `/api/share?date=...` anexado
4. Ao colar no LinkedIn, o link expande no card rico com imagem (graças à função serverless)

### Como o preview de link funciona

Crawlers de redes sociais **não executam JavaScript**, então nunca veem as meta tags que um SPA define em runtime. A função `api/share.js`:
1. Recebe `?date=2026-05-19`
2. Lê a newsletter no Supabase (via REST + anon key)
3. Devolve HTML **estático** com `og:title`, `og:description` e `og:image` (= o infográfico do episódio)
4. Redireciona humanos pra página real do SPA (`?view=public&date=...`)

Resultado: o LinkedIn renderiza um card profissional com a imagem do episódio, e o visitante humano cai na página normal.

### Infográfico do Episódio

No **Passo 5 (Briefing)** do wizard de Newsletter agora tem um card "📊 Infográfico do Episódio":
- Upload de imagem (até 10MB) pro Storage, ou cole uma URL
- Legenda opcional
- Aparece em destaque na página pública do episódio (com lightbox de zoom)
- Vira automaticamente a imagem do preview no LinkedIn



### Limites de upload de arquivo (v13 atualizado)

| Tipo | Limite | Armazenamento |
|---|---|---|
| Áudio NotebookLM (MP3 do Passo 5) | **50MB** | Supabase Storage (`audio/`) |
| Vídeo do Podcast Semanal | **300MB** (upload resumável/TUS) | Supabase Storage (`video/`) |
| Infográfico do Episódio (PNG/JPG/WEBP) | **10MB** | Supabase Storage (`image/`) |
| Thumbnail | URL externa apenas | — |

**Por que Storage e não JSONB?**
- JSONB inflaciona 33% em base64 → 250MB vídeo vira 333MB no banco
- Free tier do Postgres é só 500MB → estouraria com 1-2 vídeos
- Storage retorna URL CDN com cache → `<video>` carrega em stream, não trava mobile
- Free tier do Storage é 1GB armazenamento + 2GB/mês bandwidth (vs 500MB total do DB)

**Custo na prática (Free tier do Supabase):**
- ~4 vídeos de 250MB/mês cabem nos 1GB iniciais
- Depois disso → Pro ($25/mês = 100GB Storage + 200GB bandwidth)
- Áudios do NotebookLM (5-20MB) consomem espaço desprezível

### Configuração extra no Supabase Dashboard (se quiser ajustar)

Por padrão o SQL configura o bucket com **300MB por arquivo** (buffer acima do limite de 250MB da UI). Se quiser mais, vá em:
- Dashboard → Storage → `media` bucket → ⚙ Settings → File size limit
- Limite máximo absoluto do Supabase: 5GB por arquivo (com TUS resumable upload)

---

## Workflow: Newsletter (Wizard 6 passos)

Aba **Newsletter** no admin (`?view=admin`).

### Passo 1 · Buscar Notícias
- Botão **🔍 Buscar Notícias da Semana** chama o Claude com web search, priorizando suas fontes ativas
- Lista 12 manchetes com **checkboxes** (todas pré-marcadas)
- Botão **⭐ Marcar destaque** em cada uma (vira "destaque" na publicação)
- Manchetes em inglês ganham chip **🇺🇸→🇧🇷 traduzido** (tradução automática para PT-BR)
- Botões **✓ Marcar todas** / **✗ Desmarcar**
- **Todas as 12 manchetes ficam salvas** na newsletter (campo `sourceCandidates`), mesmo as desmarcadas — para reuso futuro

### Passo 2 · Curadoria
- Botão **✨ Gerar Resumo com IA** — tom **direto, simples, entusiasta com exemplos claros**
- Resumo aparece em editor de texto editável (Fraunces serif)
- Empresas + Tópicos extraídos automaticamente, clicáveis para remover

### Passo 3 · Temas em Destaque
- Botão **✨ Gerar Insights** — gera os 3 textos (Produtividade / Sistêmico / LLM-IA)
- Cada área num cartão com cor própria (vermelho / dourado / preto), totalmente editáveis

### Passo 4 · Título & Subtítulo
- **✨ Gerar Título** (max 7 palavras, magnético)
- **✨ Gerar Subtítulo** (frase de impacto, max 25 palavras)
- Editáveis após geração

### Passo 5 · Briefing IA (NotebookLM)
- Briefing automaticamente preenchido com **TÍTULO**, **SUBTÍTULO/TESE**, **RESUMO**, **EMPRESAS**, **TÓPICOS**, **FONTES** (URLs)
- Botão **📋 Copiar** + atalho **↗ NotebookLM**
- Upload do MP3 gerado externamente (até 25MB) OU campo de URL
- Instruções numeradas

### Passo 6 · Rascunho & Publicar
- **Preview** completo de como ficará a newsletter pública (mimicando o layout final)
- Vê o áudio do NotebookLM já embutido
- Botão **✅ Publicar Edição** → vai pra Supabase, aparece imediatamente na landing

---

## Workflow: Podcast Semanal (HeyGen)

Aba **Podcast Semanal** no admin.

### A · Selecionar newsletters-base
Lista todas as newsletters publicadas com checkboxes — escolha 1-7 que vão alimentar o podcast.

### B · Gerar Roteiro com IA
Botão **✨ Gerar Roteiro com IA** chama o Claude com TODAS as newsletters selecionadas (resumo, empresas, tópicos, manchetes) e gera:

```
[CENA 1 · Reação: animada · ~20s]
Olá pessoal, bem-vindos ao Sync·MI Semanal de 12 a 18 de maio.
Foi uma semana intensa em IA...

[QUEBRA · 1s]

[CENA 2 · Reação: focada · ~50s]
Vamos começar pelo grande lançamento da semana: a OpenAI anunciou...
```

**Formato HeyGen-compatível**: marcadores `[CENA N · Reação: <descritor> · ~<segundos>s]` antes de cada cena + `[QUEBRA · Xs]` entre elas. Reações: animada, focada, surpresa, séria, animadora, reflexiva.

Você copia cena por cena no HeyGen Studio (multi-scene), configurando a reação do avatar conforme indicado.

A IA também gera **título + descrição + 5 highlights** automaticamente.

### C · Metadados
Edita título (Fraunces), descrição (estilo YouTube), highlights (lista linha-a-linha).

### D · Vídeo
- Cola URL do vídeo gerado no HeyGen
- OU faz upload de .mp4 (até 30MB)
- Thumbnail (opcional)
- Formato: 16:9 (horizontal default), 9:16, 1:1
- Duração em min

**💾 Salvar Podcast** → aparece em `/?view=podcasts` (galeria pública)

---

## Páginas públicas

| URL | O que mostra |
|---|---|
| `/?view=landing` (default) | Hero + Newsletter em destaque + Arquivo + Podcast em destaque + Grid de podcasts |
| `/?view=public&date=YYYY-MM-DD` | Newsletter individual (estilo editorial) |
| `/?view=podcasts` | Galeria estilo YouTube — featured + grid |
| `/?view=podcast&id=podcast:YYYY-MM-DD` | Player do podcast + descrição + highlights + newsletters-base + sidebar de outros episódios |

A página de detalhe do podcast **incrementa o view count automaticamente** (1 por sessão).

---

## Estrutura

```
podcast-studio/
├── index.html         ← TUDO em um arquivo
├── setup-supabase.sql ← 10 tabelas + RLS + triggers
└── SETUP.md           ← este
```

Tabelas Supabase:
`newsletters`, `comments`, `views`, `episodes`, `settings`, `videoblobs`, `audioblobs`, `news_sources`, **`podcasts`**, **`podviews`** (as duas últimas são novas no v13).

---

## Troubleshooting

**Wizard pula passo** → confirme se gerou conteúdo antes (cada passo valida antes de avançar)

**Roteiro do HeyGen muito longo** → ajuste `max_tokens` no `generateHeyGenScript` (atual 3500), ou peça pra IA refazer com menos cenas

**Vídeo HeyGen não carrega na página de detalhe** → algumas URLs do HeyGen têm `X-Frame-Options`. Use "↗ Abrir externamente"

**View count não incrementa** → confira que rodou o SQL atualizado (criou `podviews`) e que a policy `pv_public_insert` existe
