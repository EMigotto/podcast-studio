# 🎙️ PodcastStudio — Avatar AI

Aplicação administrativa para produção semanal de podcasts em vídeo com avatar IA.
Pipeline completo: **Pauta → Roteiro IA → Avatar (Kling AI / HeyGen) → Render → Distribuição**.

![tab](https://img.shields.io/badge/Kling_AI-Avatar_v2-00b4ff)
![tab](https://img.shields.io/badge/HeyGen-Avatar_IV-7c3aed)
![tab](https://img.shields.io/badge/Claude-Sonnet_4-D97706)

## ✨ Funcionalidades

- 📡 **Pauta** — Busca de manchetes tech & IA da semana via web search; integração com podcasts do Spotify (IA Todo Dia, No Priors, Practical AI…)
- 📖 **Leitura Resumida** — Gera roteiro pronto para apresentador com IA
- ⚙️ **Config Avatar** — Upload da foto, configuração de role, emoção, gestos e câmera Kling/HeyGen
- ✍️ **Roteiro Kling-Native** — Refinamento com `[pausa]`, `*ênfases*` e `[?]` reconhecidos pelo Kling AI
- 🎬 **Render** — Pipeline para Kling AI Avatar 2 ou HeyGen Avatar IV
- 📤 **Distribuição** — E-mail / Slack / Spotify for Podcasters / Teams / YouTube

## 🚀 Quick Start (local)

```bash
npm install
cp .env.example .env   # Cole sua ANTHROPIC_API_KEY
npm run dev
```

Abre em `http://localhost:5173`.

## 🌍 Deploy

A aplicação é estática (front-end) **+ uma serverless function** (`/api/claude`) que protege a chave da API Anthropic. Não exponha a chave no front-end.

### Deploy no Vercel (mais simples)

1. Sobe o projeto pro GitHub (ver seção abaixo).
2. Vai em [vercel.com/new](https://vercel.com/new) → importa o repo.
3. Adiciona em **Environment Variables**:
   - `ANTHROPIC_API_KEY` = sua chave da [console.anthropic.com](https://console.anthropic.com)
4. Click **Deploy**.

A função em `api/claude.js` é detectada automaticamente pelo Vercel.

### Deploy no Netlify

1. Sobe pro GitHub.
2. Vai em [app.netlify.com/start](https://app.netlify.com/start) → escolhe o repo.
3. Em **Site settings → Environment variables**, adiciona `ANTHROPIC_API_KEY`.
4. Build command: `npm run build` · Publish dir: `dist` (já configurado em `netlify.toml`).

### Deploy no GitHub Pages (limitado)

GitHub Pages não suporta serverless functions. Funciona só se você puser a chave da API direto no código (NÃO recomendado em produção).

## 📤 Como subir pro GitHub

```bash
cd podcast-studio
git init
git add .
git commit -m "feat: initial PodcastStudio"
git branch -M main
gh repo create podcast-studio --public --source=. --push
```

Sem o `gh` CLI, crie o repo manualmente em [github.com/new](https://github.com/new), depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/podcast-studio.git
git push -u origin main
```

## 🔑 APIs Configuradas

- **Kling AI** (pré-configurada no código) — chave em `src/PodcastStudio.jsx`, constante `KLING_API_KEY`
- **HeyGen** (configurável na UI) — adicione em **Config Avatar** → API Key + Avatar ID
- **Anthropic Claude** — via `ANTHROPIC_API_KEY` no servidor

## 🏗️ Estrutura

```
podcast-studio/
├── api/claude.js               ← Vercel serverless proxy
├── netlify/functions/claude.js ← Netlify equivalente
├── src/
│   ├── main.jsx
│   └── PodcastStudio.jsx       ← App principal
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── netlify.toml
└── .env.example
```

## ⚠️ Notas de Segurança

- A chave Kling AI está no código fonte. Para produção, mova para variável de ambiente e adicione um proxy `/api/kling` similar.
- A chave Anthropic **NUNCA** vai pro client — sempre via proxy serverless.

## 📝 Licença

MIT
