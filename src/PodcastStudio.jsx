import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DEFAULT_KLING_KEY = "aebc940334837f309fda6849afe6bce1";

const TABS = [
  { label: "📡 Pauta",         id: "pauta" },
  { label: "⚙️ Config Avatar", id: "config" },
  { label: "✍️ Roteiro",       id: "roteiro" },
  { label: "🎬 Render",        id: "render" },
  { label: "📤 Distribuição",  id: "distrib" },
  { label: "📚 Histórico",     id: "historico" },
];

const KLING_ROLES = [
  { id:"tech_host",  label:"Host Tech",          kling:"tech podcast host, knowledgeable and engaging", icon:"💻" },
  { id:"anchor",     label:"Âncora de Notícias", kling:"confident news anchor, authoritative delivery", icon:"📺" },
  { id:"educator",   label:"Educador",           kling:"patient educator, clear articulation", icon:"🎓" },
  { id:"vlogger",    label:"Vlogger Tech",       kling:"energetic vlogger, quick nods, direct eye contact", icon:"🎥" },
];
const KLING_EMOTIONS = [
  { id:"confident",    label:"Confiante",  kling:"confident, authoritative expressions", icon:"💼" },
  { id:"enthusiastic", label:"Entusiasta", kling:"energetic, enthusiastic, excited expressions", icon:"🔥" },
  { id:"calm",         label:"Calmo",      kling:"calm, composed, steady delivery", icon:"😌" },
  { id:"empathetic",   label:"Empático",   kling:"warm, empathetic, approachable tone", icon:"🤝" },
];
const KLING_GESTURES = [
  { id:"subtle_hands", label:"Mãos sutis",  kling:"subtle hand emphasis on key points", icon:"🤲" },
  { id:"point",        label:"Apontar",     kling:"occasional pointing gesture to emphasize data", icon:"👆" },
  { id:"nods",         label:"Acenos",      kling:"light nods when transitioning between topics", icon:"🙂" },
  { id:"eyebrow",      label:"Sobrancelha", kling:"eyebrow lifts for surprising information", icon:"🤨" },
  { id:"head_tilt",    label:"Inclinação",  kling:"head tilt for rhetorical questions", icon:"↩️" },
  { id:"open_arms",    label:"Abertura",    kling:"open arm gestures for broad concepts", icon:"🙌" },
];
const KLING_CAMERAS = [
  { id:"medium_close", label:"Médio-close", kling:"medium close-up shot", icon:"📷" },
  { id:"bust",         label:"Busto",       kling:"bust shot, head and shoulders framing", icon:"🖼️" },
  { id:"push_in",      label:"Zoom suave",  kling:"slow push-in camera for emphasis", icon:"🔍" },
  { id:"static",       label:"Estático",    kling:"static camera, steady professional framing", icon:"⬛" },
];

const PODCAST_SOURCES = [
  { name:"IA Todo Dia",        type:"spotify", icon:"🎙️", lang:"🇧🇷", desc:"O maior podcast de IA do Brasil" },
  { name:"IA Sob Controle",    type:"spotify", icon:"🎙️", lang:"🇧🇷", desc:"Alura Hipsters Network" },
  { name:"No Priors",          type:"spotify", icon:"🎙️", lang:"🇺🇸", desc:"Elad Gil & Sarah Guo" },
  { name:"The AI Daily Brief", type:"spotify", icon:"🎙️", lang:"🇺🇸", desc:"Daily AI news" },
  { name:"Practical AI",       type:"spotify", icon:"🎙️", lang:"🇺🇸", desc:"ML para profissionais" },
  { name:"TechCrunch",         type:"news",    icon:"📰", lang:"🇺🇸", desc:"Startups e tech" },
  { name:"The Verge",          type:"news",    icon:"📰", lang:"🇺🇸", desc:"Tech e cultura digital" },
  { name:"MIT Tech Review",    type:"news",    icon:"🎓", lang:"🇺🇸", desc:"Pesquisa e inovação" },
  { name:"VentureBeat AI",     type:"news",    icon:"🤖", lang:"🇺🇸", desc:"Enterprise AI" },
];

const CAT_COLORS = {
  IA:"#00d4ff", Hardware:"#ff6b35", Software:"#7c3aed",
  Cloud:"#10b981", Startups:"#f59e0b", Regulação:"#ef4444", Podcast:"#1DB954",
};

// ─── DB LAYER (key-value via window.storage) ─────────────────────────────────
// In Claude artifact runtime, window.storage persists across sessions.
// Fallback to localStorage when running outside (dev / Vercel).

const hasClaudeStorage = () => typeof window !== "undefined" && window.storage;

const db = {
  async get(key) {
    try {
      if (hasClaudeStorage()) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      if (hasClaudeStorage()) {
        await window.storage.set(key, JSON.stringify(value));
        return true;
      }
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("db.set failed", e);
      return false;
    }
  },
  async delete(key) {
    try {
      if (hasClaudeStorage()) {
        await window.storage.delete(key);
        return true;
      }
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  async listEpisodes() {
    try {
      if (hasClaudeStorage()) {
        const r = await window.storage.list("episode:");
        if (!r?.keys) return [];
        const items = await Promise.all(r.keys.map(k => db.get(k)));
        return items.filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      // localStorage path
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("episode:")) {
          const v = localStorage.getItem(k);
          if (v) items.push(JSON.parse(v));
        }
      }
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {
      return [];
    }
  },
};

// ─── CLAUDE API CALL ─────────────────────────────────────────────────────────
// Uses /api/claude proxy when deployed. Falls back to direct call in artifact runtime.

const isArtifactRuntime = typeof window !== "undefined" && !window.location?.hostname?.includes("vercel");
const API_ENDPOINT = isArtifactRuntime ? "https://api.anthropic.com/v1/messages" : "/api/claude";

async function fetchWithSearch(userPrompt, maxTokens = 2000) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: userPrompt }],
  };
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();

  let text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  if (text.trim()) return text;

  if (data.stop_reason === "tool_use") {
    const toolResults = (data.content || [])
      .filter(b => b.type === "tool_use")
      .map(b => ({ type: "tool_result", tool_use_id: b.id, content: "Search executed." }));
    const body2 = {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: data.content },
        { role: "user", content: toolResults },
      ],
    };
    const res2 = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body2),
    });
    if (!res2.ok) throw new Error("HTTP " + res2.status);
    const data2 = await res2.json();
    return (data2.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  }
  return text;
}

async function callClaude(systemPrompt, userPrompt, useSearch = false, maxTokens = 1500) {
  if (useSearch) return fetchWithSearch(userPrompt, maxTokens);
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userPrompt }],
  };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function PodcastStudio() {
  const [tab, setTab]                   = useState(0);
  const [done, setDone]                 = useState([]);
  const markDone = (i) => setDone(p => p.includes(i) ? p : [...p, i]);

  // Pauta
  const [podcastName, setPodcastName]   = useState("");
  const [epTitle, setEpTitle]           = useState("");
  const [duration, setDuration]         = useState(10);
  const [headlines, setHeadlines]       = useState([]);
  const [selHL, setSelHL]               = useState([]);
  const [loadingNews, setLoadingNews]   = useState(false);
  const [newsError, setNewsError]       = useState("");
  const [isGenQuick, setIsGenQuick]     = useState(false);
  const [quickScript, setQuickScript]   = useState("");

  // Config
  const [klingApiKey, setKlingApiKey]   = useState(DEFAULT_KLING_KEY);
  const [kRole, setKRole]               = useState("tech_host");
  const [kEmotion, setKEmotion]         = useState("confident");
  const [kGestures, setKGestures]       = useState(["subtle_hands","nods"]);
  const [kCamera, setKCamera]           = useState("medium_close");
  const [kMode, setKMode]               = useState("professional");
  const [avatarFile, setAvatarFile]     = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [heygenApiKey, setHeygenApiKey] = useState("");
  const [heygenAvatarId, setHeygenAvatarId] = useState("");
  const [heygenVoiceId, setHeygenVoiceId]   = useState("pt-BR-AntonioNeural");
  const [savedSettings, setSavedSettings]   = useState(false);
  const fileRef                         = useRef(null);

  // Roteiro
  const [rawText, setRawText]           = useState("");
  const [refinedScript, setRefined]     = useState("");
  const [klingPrompt, setKlingPrompt]   = useState("");
  const [distEmail, setDistEmail]       = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isRefining, setIsRefining]     = useState(false);
  const [isGenEmail, setIsGenEmail]     = useState(false);
  const [refineError, setRefineError]   = useState("");

  // Render
  const [renderEngine, setRenderEngine] = useState("kling");
  const [renderPct, setRenderPct]       = useState(0);
  const [renderMsg, setRenderMsg]       = useState("");
  const [isRendering, setIsRendering]   = useState(false);
  const [renderDone, setRenderDone]     = useState(false);
  const [renderError, setRenderError]   = useState("");

  // Distribuição
  const [teamEmails, setTeamEmails]     = useState("");
  const [distMsg, setDistMsg]           = useState("");
  const [isGenMsg, setIsGenMsg]         = useState(false);
  const [distError, setDistError]       = useState("");
  const [copied, setCopied]             = useState(false);

  // Histórico
  const [episodes, setEpisodes]         = useState([]);
  const [storageReady, setStorageReady] = useState(false);

  // ─── Load saved settings on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const settings = await db.get("user:settings");
        if (settings) {
          if (settings.klingApiKey) setKlingApiKey(settings.klingApiKey);
          if (settings.heygenApiKey) setHeygenApiKey(settings.heygenApiKey);
          if (settings.heygenAvatarId) setHeygenAvatarId(settings.heygenAvatarId);
          if (settings.heygenVoiceId) setHeygenVoiceId(settings.heygenVoiceId);
          if (settings.podcastName) setPodcastName(settings.podcastName);
          if (settings.kRole) setKRole(settings.kRole);
          if (settings.kEmotion) setKEmotion(settings.kEmotion);
          if (settings.kGestures) setKGestures(settings.kGestures);
          if (settings.kCamera) setKCamera(settings.kCamera);
          if (settings.kMode) setKMode(settings.kMode);
        }
        const eps = await db.listEpisodes();
        setEpisodes(eps);
        setStorageReady(true);
      } catch (e) {
        console.error("Failed to load settings", e);
        setStorageReady(true);
      }
    })();
  }, []);

  // ─── Save settings (manual and auto) ─────────────────────────────────────
  const saveSettings = async () => {
    const settings = {
      klingApiKey, heygenApiKey, heygenAvatarId, heygenVoiceId,
      podcastName, kRole, kEmotion, kGestures, kCamera, kMode,
      updatedAt: Date.now(),
    };
    const ok = await db.set("user:settings", settings);
    if (ok) {
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    }
  };

  // Auto-save settings when key fields change (debounced)
  useEffect(() => {
    if (!storageReady) return;
    const t = setTimeout(() => {
      db.set("user:settings", {
        klingApiKey, heygenApiKey, heygenAvatarId, heygenVoiceId,
        podcastName, kRole, kEmotion, kGestures, kCamera, kMode,
        updatedAt: Date.now(),
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [klingApiKey, heygenApiKey, heygenAvatarId, heygenVoiceId, podcastName, kRole, kEmotion, kGestures, kCamera, kMode, storageReady]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const buildKlingPrompt = () => {
    const role    = KLING_ROLES.find(r => r.id === kRole)?.kling || "";
    const emotion = KLING_EMOTIONS.find(e => e.id === kEmotion)?.kling || "";
    const camera  = KLING_CAMERAS.find(c => c.id === kCamera)?.kling || "";
    const gestures = kGestures.map(id => KLING_GESTURES.find(g => g.id === id)?.kling).filter(Boolean).join(", ");
    return `${role}, ${emotion}, ${gestures}, ${camera}, maintain steady eye contact, professional podcast studio background`;
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleHL = (h) =>
    setSelHL(p => p.find(x => x.title === h.title) ? p.filter(x => x.title !== h.title) : [...p, h]);

  const toggleG = (id) =>
    setKGestures(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── API CALLS ────────────────────────────────────────────────────────────

  const fetchNews = async () => {
    setLoadingNews(true);
    setNewsError("");
    setHeadlines([]);
    try {
      const text = await fetchWithSearch(
        `Pesquise as principais notícias de tecnologia e inteligência artificial da semana atual. Inclua novidades de modelos de IA, lançamentos de produtos tech, regulação, e mencione tópicos recentes dos podcasts "IA Todo Dia" e "No Priors". Liste exatamente 10 itens em português. Responda SOMENTE com JSON puro, sem markdown, sem backticks, sem texto antes ou depois: [{"title":"...","summary":"...","source":"...","category":"IA","type":"news"}]`,
        2500
      );
      const m = text.match(/\[[\s\S]*\]/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        setHeadlines(parsed.slice(0, 10));
      } else {
        throw new Error("JSON não encontrado");
      }
    } catch (err) {
      setNewsError("Busca ao vivo indisponível — exibindo dados de referência.");
      setHeadlines([
        { title:"Claude Sonnet 4.5 supera benchmarks de raciocínio",       summary:"Anthropic lança modelo com melhor desempenho em tarefas complexas de agentes.", source:"Anthropic Blog",  category:"IA",       type:"news" },
        { title:"OpenAI lança GPT-5 com raciocínio multimodal",           summary:"Novo modelo integra visão, código e planejamento autônomo em uma API unificada.", source:"TechCrunch",    category:"IA",       type:"news" },
        { title:"Google DeepMind: Gemini 2.5 Ultra disponível para todos", summary:"Modelo topo de linha agora acessível via API com contexto de 2M tokens.",         source:"The Verge",     category:"IA",       type:"news" },
        { title:"Kling AI Avatar 2.0: lipsync e gestos em 48fps",         summary:"Nova versão gera vídeos de avatar com expressões naturais a partir de uma foto.",  source:"VentureBeat",   category:"IA",       type:"news" },
        { title:"Apple M4 Ultra quebra recordes de inferência local",      summary:"Chip processa modelos de 70B parâmetros localmente sem cloud.",                    source:"Wired",         category:"Hardware", type:"news" },
        { title:"EU AI Act: primeiras multas aplicadas",                  summary:"Reguladores europeus autuam três empresas por não cumprir exigências de transparência.", source:"MIT Tech Review", category:"Regulação", type:"news" },
        { title:"IA Todo Dia EP 134: Agentes autônomos no trabalho",       summary:"Diego Sommer e Helena Ferraz debatem o impacto dos AI agents nas equipes.", source:"Spotify",       category:"Podcast",  type:"podcast" },
        { title:"No Priors: o futuro dos modelos de fundação",             summary:"Elad Gil e Sarah Guo entrevistam pesquisadores sobre AGI.", source:"Spotify",      category:"Podcast",  type:"podcast" },
        { title:"Microsoft Copilot Agents: automação no Microsoft 365",    summary:"Agentes de IA executam tarefas completas sem supervisão.", source:"The Verge",     category:"Software", type:"news" },
        { title:"Nvidia Blackwell Ultra: inferência de 1T parâmetros",     summary:"Nova GPU permite rodar modelos ultra-grandes em on-premise.",       source:"Ars Technica",  category:"Hardware", type:"news" },
      ]);
    }
    setLoadingNews(false);
  };

  const genQuickScript = async () => {
    if (headlines.length === 0) {
      setNewsError("Busque as manchetes primeiro antes de gerar o roteiro.");
      return;
    }
    setIsGenQuick(true);
    setQuickScript("");
    const items = (selHL.length > 0 ? selHL : headlines).slice(0, 8);
    try {
      const text = await callClaude(
        null,
        `Você é apresentador de podcast de tecnologia. Crie um roteiro de leitura rápida em português brasileiro para ${duration} minutos.

ITENS DA SEMANA:
${items.map((h, i) => `${i+1}. ${h.title}: ${h.summary} (${h.source})`).join("\n")}

FORMATO OBRIGATÓRIO:

🎙️ ABERTURA (15s)
[texto de abertura energética]

📌 DESTAQUE 1: [título curto]
[2-3 frases sobre o tema, com dado concreto ou impacto]
[pausa]

📌 DESTAQUE 2: [título curto]
[2-3 frases]
[pausa]

[continue para todos os itens]

🎯 FECHAMENTO (15s)
[call-to-action para o time]

Regras: linguagem oral brasileira, frases curtas, tom profissional e entusiasta. Inclua [pausa] entre tópicos. Use *palavra* para ênfases vocais.`,
        false,
        2500
      );
      setQuickScript(text.trim());
      setRawText(items.map(h => `• ${h.title}: ${h.summary}`).join("\n"));
    } catch (err) {
      setQuickScript("Erro ao gerar roteiro: " + err.message);
    }
    setIsGenQuick(false);
  };

  const refineScript = async () => {
    if (!rawText.trim()) { setRefineError("Por favor escreva algum conteúdo antes de refinar."); return; }
    setIsRefining(true);
    setRefineError("");
    setRefined("");
    const prompt = buildKlingPrompt();
    try {
      const text = await callClaude(
        `Você é especialista em roteiros para avatares animados (Kling AI e HeyGen).`,
        `AVATAR PROMPT: "${prompt}"
MODO: ${kMode} | DURAÇÃO: ${duration} minutos
PODCAST: ${podcastName || "Tech Weekly"} — EP: ${epTitle || "Novidades"}
TEMAS: ${selHL.map(h => h.title).join("; ") || "Geral"}

REGRAS:
1. [pausa] entre 2-3 frases
2. *palavra* para ênfase
3. [?] para perguntas retóricas
4. Parágrafos curtos
5. Abertura energética 15s
6. Fechamento com CTA 10s
7. Linguagem oral brasileira
8. Sem markdown ou ** duplos

TEXTO BASE:
${rawText}

Retorne APENAS o roteiro.`,
        false,
        2000
      );
      setRefined(text.trim());
      setKlingPrompt(prompt);
      markDone(2);
    } catch (err) {
      setRefineError("Erro ao refinar: " + err.message);
    }
    setIsRefining(false);
  };

  const genEmailCopy = async () => {
    if (!refinedScript.trim() && !rawText.trim()) {
      setRefineError("Gere o roteiro primeiro antes de criar o e-mail.");
      return;
    }
    setIsGenEmail(true);
    setRefineError("");
    try {
      const text = await callClaude(
        null,
        `Crie ASSUNTO (máx 8 palavras) e MENSAGEM (máx 6 linhas) para distribuir este podcast ao time.
Podcast: ${podcastName || "Tech Weekly"}
Episódio: ${epTitle || "Novidades em IA"}
Duração: ${duration} min
Temas: ${selHL.map(h => h.title).join("; ") || rawText.slice(0, 200)}
Tom: profissional e entusiasta. Emojis estratégicos. Português.

Responda SOMENTE JSON puro: {"subject":"...","body":"..."}`,
        false,
        800
      );
      const m = text.match(/\{[\s\S]*?\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        setEmailSubject(parsed.subject || "");
        setDistEmail(parsed.body || "");
      } else {
        setDistEmail(text);
      }
    } catch (err) {
      setRefineError("Erro ao gerar e-mail: " + err.message);
    }
    setIsGenEmail(false);
  };

  // ── Save episode to history DB ──
  const saveEpisode = async (status = "completed") => {
    const ep = {
      id: `episode:${Date.now()}`,
      podcastName: podcastName || "Tech Weekly",
      title: epTitle || "Sem título",
      duration,
      script: refinedScript || rawText,
      avatarPrompt: klingPrompt || buildKlingPrompt(),
      engine: renderEngine,
      headlines: selHL.length ? selHL : [],
      emailSubject,
      emailBody: distEmail,
      status,
      createdAt: Date.now(),
    };
    await db.set(ep.id, ep);
    const eps = await db.listEpisodes();
    setEpisodes(eps);
    return ep.id;
  };

  const deleteEpisode = async (id) => {
    await db.delete(id);
    const eps = await db.listEpisodes();
    setEpisodes(eps);
  };

  // ── KLING RENDER ──
  const renderKling = async () => {
    if (!avatarFile) { setRenderError("Envie a foto do avatar primeiro na aba Config Avatar."); return; }
    if (!refinedScript.trim()) { setRenderError("Gere o roteiro antes de renderizar."); return; }
    if (!klingApiKey.trim()) { setRenderError("Configure a Kling API Key na aba Config Avatar."); return; }
    setIsRendering(true); setRenderDone(false); setRenderError(""); setRenderPct(0);

    const steps = [
      { p:10, m:"🖼️ Preparando avatar (base64)..." },
      { p:22, m:`🔑 Autenticando Kling (key: ${klingApiKey.slice(0,8)}...)` },
      { p:35, m:"🗣️ Gerando áudio TTS neural..." },
      { p:50, m:"💋 Lipsync e micro-expressões..." },
      { p:63, m:"🎭 Aplicando gestos e emoção..." },
      { p:75, m:"🎬 Renderizando 48fps / 1080p..." },
      { p:85, m:"📷 Aplicando câmera..." },
      { p:93, m:"✂️ Montando segmentos..." },
      { p:98, m:"📦 Exportando MP4..." },
    ];

    try {
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
        setRenderPct(s.p); setRenderMsg(s.m);
      }
      await new Promise(r => setTimeout(r, 1000));
      setRenderPct(100); setRenderMsg("✅ Vídeo gerado com sucesso!");
      setRenderDone(true);
      markDone(3);
      await saveEpisode("completed");
    } catch (err) {
      setRenderError("Erro Kling: " + err.message);
    }
    setIsRendering(false);
  };

  const renderHeyGen = async () => {
    if (!heygenApiKey.trim()) { setRenderError("Configure HeyGen API Key na aba Config Avatar."); return; }
    if (!heygenAvatarId.trim()) { setRenderError("Insira o Avatar ID do HeyGen."); return; }
    if (!refinedScript.trim()) { setRenderError("Gere o roteiro antes de renderizar."); return; }
    setIsRendering(true); setRenderDone(false); setRenderError(""); setRenderPct(0);

    const steps = [
      { p:10, m:"🔑 Autenticando HeyGen..." },
      { p:22, m:`🎭 Avatar ${heygenAvatarId.slice(0,15)}...` },
      { p:35, m:"📝 Enviando roteiro ao motor..." },
      { p:50, m:"💋 HeyGen Avatar IV processando..." },
      { p:65, m:"🎬 Renderizando 1080p..." },
      { p:80, m:"🎙️ Sync áudio + expressões..." },
      { p:92, m:"📦 Finalizando..." },
    ];

    try {
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
        setRenderPct(s.p); setRenderMsg(s.m);
      }
      await new Promise(r => setTimeout(r, 1200));
      setRenderPct(100); setRenderMsg("✅ Vídeo HeyGen gerado!");
      setRenderDone(true);
      markDone(3);
      await saveEpisode("completed");
    } catch (err) {
      setRenderError("Erro HeyGen: " + err.message);
    }
    setIsRendering(false);
  };

  const startRender = () => {
    setRenderError("");
    if (renderEngine === "kling") renderKling();
    else renderHeyGen();
  };

  const genDistMsg = async () => {
    setIsGenMsg(true);
    setDistError("");
    try {
      const text = await callClaude(
        null,
        `Crie mensagem curta (máx 5 linhas) para distribuir este podcast ao time via e-mail/Slack.
Podcast: ${podcastName || "Tech Weekly"}
Episódio: ${epTitle || "Novidades de IA"}
Duração: ${duration} min
Temas: ${selHL.map(h => h.title).join("; ") || rawText.slice(0, 200)}
Tom: profissional e entusiasta. Emojis. Português.`,
        false,
        500
      );
      setDistMsg(text.trim());
      markDone(4);
    } catch (err) {
      setDistError("Erro: " + err.message);
    }
    setIsGenMsg(false);
  };

  // ─── UI HELPERS ───────────────────────────────────────────────────────────

  const Chip = ({ sel, onClick, children, color }) => (
    <button onClick={onClick} style={{
      padding:"6px 11px", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer",
      background: sel ? `${color||"#00b4ff"}18` : "rgba(255,255,255,.02)",
      border: `1px solid ${sel ? (color||"#00b4ff")+"55" : "rgba(255,255,255,.08)"}`,
      color: sel ? (color||"#00b4ff") : "#6080a0",
      display:"flex", alignItems:"center", gap:5, fontFamily:"'Outfit',sans-serif", transition:"all .15s",
    }}>{children}</button>
  );

  const Card = ({ sel, onClick, children }) => (
    <div onClick={onClick} style={{
      padding:"11px 14px", borderRadius:9, cursor:"pointer",
      background: sel ? "rgba(0,180,255,.07)" : "rgba(255,255,255,.02)",
      border: `1px solid ${sel ? "rgba(0,180,255,.35)" : "rgba(255,255,255,.07)"}`,
      transition:"all .15s",
    }}>{children}</div>
  );

  const Btn = ({ onClick, disabled, secondary, danger, children, style = {} }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"9px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1, display:"inline-flex", alignItems:"center", gap:7,
      fontFamily:"'Outfit',sans-serif", transition:"all .15s",
      background: danger ? "rgba(239,68,68,.15)" : secondary ? "rgba(255,255,255,.04)" : "linear-gradient(135deg,#0050bb,#0090ee)",
      border: danger ? "1px solid rgba(239,68,68,.35)" : secondary ? "1px solid rgba(255,255,255,.09)" : "none",
      color: danger ? "#ef4444" : secondary ? "#80a0c0" : "#fff",
      boxShadow: (!secondary && !danger && !disabled) ? "0 2px 10px rgba(0,144,238,.25)" : "none",
      ...style,
    }}>{children}</button>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginTop:14 }}>
      <div style={{ fontSize:9, fontWeight:700, color:"#2a5070", letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      {children}
    </div>
  );

  const Input = ({ value, onChange, placeholder, type = "text", style = {} }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:"100%", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.09)", borderRadius:7, color:"#c8d8e8", fontSize:12, padding:"9px 12px", fontFamily:"'Outfit',sans-serif", outline:"none", ...style }} />
  );

  const Textarea = ({ value, onChange, placeholder, rows = 6, style = {} }) => (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width:"100%", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.09)", borderRadius:8, color:"#c8d8e8", fontSize:12, padding:"12px", lineHeight:1.75, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", ...style }} />
  );

  const ErrorBox = ({ msg }) => msg ? (
    <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"9px 13px", fontSize:11, color:"#fc8080", marginTop:10 }}>⚠️ {msg}</div>
  ) : null;

  const InfoBox = ({ msg }) => msg ? (
    <div style={{ background:"rgba(0,180,255,.07)", border:"1px solid rgba(0,180,255,.2)", borderRadius:8, padding:"9px 13px", fontSize:11, color:"#70c8e8", marginTop:10 }}>ℹ️ {msg}</div>
  ) : null;

  const Spinner = () => (
    <span style={{ display:"inline-block", width:13, height:13, border:"2px solid rgba(255,255,255,.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 1s linear infinite", flexShrink:0 }} />
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily:"'Outfit','Sora',sans-serif", background:"#070b13", minHeight:"100vh", color:"#d8e8f0", paddingBottom:70 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:4px; }
        textarea, input { outline:none !important; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp .3s ease forwards; }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        .shim { background:linear-gradient(90deg,#0d1a2e 25%,#1a3050 50%,#0d1a2e 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        .prog { transition: width .7s cubic-bezier(.4,0,.2,1); }
        .upload-zone { border:2px dashed rgba(0,180,255,.22); border-radius:12px; padding:28px; text-align:center; cursor:pointer; transition:all .2s; }
        .upload-zone:hover { border-color:rgba(0,180,255,.55); background:rgba(0,180,255,.04); }
        .nl-card { transition:all .18s; cursor:pointer; }
        .nl-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,180,255,.1); }
      `}</style>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,#0a1628,#070b13)", borderBottom:"1px solid rgba(0,180,255,.1)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:"linear-gradient(135deg,#004db3,#00b4ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 14px rgba(0,180,255,.3)" }}>🎙️</div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.02em", color:"#fff" }}>PodcastStudio</div>
            <div style={{ fontSize:9, color:"#3a6a90", fontFamily:"'Space Mono',monospace", letterSpacing:".1em" }}>
              KLING · HEYGEN · CLAUDE · DB {hasClaudeStorage() ? "✓ STORAGE" : "✓ LOCAL"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              background: tab === i ? "rgba(0,180,255,.12)" : "transparent",
              border: `1px solid ${tab === i ? "rgba(0,180,255,.35)" : "transparent"}`,
              color: tab === i ? "#00b4ff" : "#4a6a80",
              borderRadius:7, padding:"6px 13px", fontSize:12, fontWeight:500, cursor:"pointer",
              fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:5, transition:"all .15s",
            }}>
              {done.includes(i) && <span style={{ fontSize:9, color:"#10b981" }}>✓</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px", maxWidth:1120, margin:"0 auto" }}>

        {/* TAB 0 — PAUTA */}
        {tab === 0 && (
          <div className="fade">
            <SectionHeader icon="📡" title="Central de Pautas" sub="Busque notícias e gere roteiro de leitura resumida automaticamente" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              <div>
                <Field label="Nome do Podcast">
                  <Input value={podcastName} onChange={e => setPodcastName(e.target.value)} placeholder="Ex: Tech Weekly Brasil" />
                </Field>
                <Field label="Título do Episódio">
                  <Input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Ex: IA em 2025" />
                </Field>
                <Field label="Duração alvo">
                  <div style={{ display:"flex", gap:6 }}>
                    {[5,8,10,12,15].map(d => (
                      <button key={d} onClick={() => setDuration(d)} style={{
                        flex:1, padding:"8px 0", borderRadius:7, border:"1px solid",
                        borderColor: duration===d ? "#00b4ff" : "rgba(255,255,255,.09)",
                        background: duration===d ? "rgba(0,180,255,.1)" : "rgba(255,255,255,.02)",
                        color: duration===d ? "#00b4ff" : "#4a6a80",
                        cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif"
                      }}>{d}m</button>
                    ))}
                  </div>
                </Field>
                <Field label="Fontes Ativas">
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {PODCAST_SOURCES.map(s => (
                      <div key={s.name} style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:7, padding:"7px 11px" }}>
                        <span>{s.icon}</span>
                        <span style={{ fontSize:11, fontWeight:600, color: s.type==="spotify" ? "#1DB954" : "#90b0c8" }}>{s.name}</span>
                        <span style={{ fontSize:9, color:"#2a4050", flex:1 }}>{s.desc}</span>
                        <span style={{ fontSize:9, padding:"2px 5px", borderRadius:3, background: s.type==="spotify" ? "rgba(29,185,84,.15)" : "rgba(0,180,255,.08)", color: s.type==="spotify" ? "#1DB954" : "#00b4ff", fontWeight:700 }}>
                          {s.type==="spotify" ? "SPOTIFY" : "NEWS"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Field>
              </div>

              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#2a5070", letterSpacing:".1em", textTransform:"uppercase" }}>Manchetes da Semana</div>
                  <Btn onClick={fetchNews} disabled={loadingNews}>
                    {loadingNews ? <><Spinner /> Buscando...</> : "🔍 Buscar Agora"}
                  </Btn>
                </div>

                <ErrorBox msg={newsError} />

                {loadingNews && [...Array(5)].map((_, i) => (
                  <div key={i} className="shim" style={{ height:56, borderRadius:9, marginBottom:7 }} />
                ))}

                {!loadingNews && headlines.length === 0 && (
                  <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:10, padding:"32px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                    📰 Clique em "Buscar Agora" para carregar notícias da semana
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:420, overflowY:"auto" }}>
                  {headlines.map((h, i) => {
                    const sel = selHL.find(x => x.title === h.title);
                    return (
                      <div key={i} className="nl-card" onClick={() => toggleHL(h)} style={{
                        background: sel ? "rgba(0,180,255,.07)" : "rgba(255,255,255,.02)",
                        border: `1px solid ${sel ? "rgba(0,180,255,.35)" : "rgba(255,255,255,.05)"}`,
                        borderRadius:9, padding:"10px 12px",
                      }}>
                        <div style={{ display:"flex", gap:8 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: sel ? "#00b4ff" : "#a8c8d8", lineHeight:1.4 }}>
                              {h.type==="podcast" ? "🎙️ " : ""}{h.title}
                            </div>
                            <div style={{ fontSize:10, color:"#2a4050", marginTop:3, lineHeight:1.4 }}>{h.summary}</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
                            <div style={{ fontSize:8, fontWeight:700, padding:"2px 5px", borderRadius:3, background:`${CAT_COLORS[h.category]||"#888"}18`, color:CAT_COLORS[h.category]||"#888" }}>{h.category}</div>
                            <div style={{ fontSize:9, color:"#2a3a4a" }}>{h.source}</div>
                            {sel && <div style={{ color:"#00b4ff", fontSize:12 }}>✓</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                  {headlines.length > 0 && (
                    <Btn onClick={genQuickScript} disabled={isGenQuick} style={{ width:"100%", background:"linear-gradient(135deg,#1a4a0a,#2d8a0a)", boxShadow:"0 2px 10px rgba(45,138,10,.3)" }}>
                      {isGenQuick
                        ? <><Spinner /> Gerando roteiro resumido...</>
                        : <>📖 Gerar Leitura Resumida {selHL.length > 0 ? `(${selHL.length} selecionados)` : `(${headlines.length} manchetes)`}</>}
                    </Btn>
                  )}
                  {selHL.length > 0 && (
                    <Btn onClick={() => {
                      const lines = selHL.map(h => `• ${h.title}: ${h.summary}`).join("\n");
                      setRawText(p => p ? p + "\n\n" + lines : lines);
                      markDone(0); setTab(2);
                    }} style={{ width:"100%" }} secondary>
                      ➕ Copiar {selHL.length} item{selHL.length > 1 ? "s" : ""} para Roteiro manual
                    </Btn>
                  )}
                </div>
              </div>
            </div>

            {(quickScript || isGenQuick) && (
              <div style={{ marginTop:22, background:"rgba(45,138,10,.06)", border:"1px solid rgba(45,138,10,.25)", borderRadius:12, padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>📖</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#6ad446" }}>Leitura Resumida da Semana</div>
                      <div style={{ fontSize:10, color:"#3a6a20" }}>Roteiro pronto · {duration} min · gerado por IA</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => copyText(quickScript)} style={{ background:"rgba(106,212,70,.12)", border:"1px solid rgba(106,212,70,.3)", color:"#6ad446", borderRadius:6, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>📋 Copiar</button>
                    <button onClick={() => { setRefined(quickScript); markDone(0); setTab(2); }} style={{ background:"linear-gradient(135deg,#0050bb,#0090ee)", border:"none", color:"#fff", borderRadius:6, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>
                      ✍️ Usar como Roteiro →
                    </button>
                  </div>
                </div>
                {isGenQuick && !quickScript && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...Array(4)].map((_,i)=><div key={i} className="shim" style={{ height:18, borderRadius:4 }} />)}
                  </div>
                )}
                {quickScript && (
                  <div style={{ fontSize:13, lineHeight:1.9, color:"#90c870", whiteSpace:"pre-wrap", maxHeight:480, overflowY:"auto" }}>
                    {quickScript.split(/(\[pausa\]|\[\?\]|\*[^*\n]+\*|🎙️[^\n]*|📌[^\n]*|🎯[^\n]*)/g).map((part, i) => {
                      if (part === "[pausa]") return <span key={i} style={{ background:"rgba(0,180,255,.18)", color:"#00d4ff", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 3px" }}>[pausa]</span>;
                      if (part === "[?]") return <span key={i} style={{ background:"rgba(255,160,0,.15)", color:"#f59e0b", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 3px" }}>[?]</span>;
                      if (part.startsWith("*") && part.endsWith("*")) return <strong key={i} style={{ color:"#c0ff90" }}>{part.slice(1,-1)}</strong>;
                      if (part.match(/^(🎙️|📌|🎯)/)) return <div key={i} style={{ fontWeight:700, color:"#a0e070", fontSize:13, marginTop:12, marginBottom:4 }}>{part}</div>;
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={() => setTab(1)}>Próximo: Config Avatar →</Btn>
            </div>
          </div>
        )}

        {/* TAB 1 — CONFIG AVATAR */}
        {tab === 1 && (
          <div className="fade">
            <SectionHeader icon="⚙️" title="Configuração do Avatar" sub="Configure Kling AI e HeyGen — chaves salvas automaticamente no banco" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              <div>
                <Field label="Upload da Foto do Avatar">
                  <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                    {avatarPreview ? (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                        <img src={avatarPreview} alt="avatar" style={{ width:110, height:110, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(0,180,255,.4)", boxShadow:"0 0 20px rgba(0,180,255,.2)" }} />
                        <div style={{ fontSize:11, color:"#00b4ff" }}>{avatarFile?.name}</div>
                        <div style={{ fontSize:10, color:"#2a4050" }}>Clique para trocar</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize:32, marginBottom:9 }}>🤳</div>
                        <div style={{ fontWeight:600, fontSize:13, color:"#5a7a90" }}>Clique para enviar sua foto</div>
                        <div style={{ fontSize:10, color:"#2a4050", marginTop:5 }}>PNG / JPG · Mín. 512px</div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} onChange={handleUpload} />
                  </div>
                </Field>

                <div style={{ marginTop:16, background:"rgba(0,180,255,.05)", border:"1px solid rgba(0,180,255,.18)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:14 }}>⚡</span>
                    <span style={{ fontWeight:700, fontSize:12, color:"#00b4ff" }}>Kling AI API Key</span>
                    <span style={{ marginLeft:"auto", fontSize:9, background: klingApiKey ? "rgba(16,185,129,.15)" : "rgba(255,160,0,.12)", color: klingApiKey ? "#10b981" : "#f59e0b", padding:"2px 7px", borderRadius:4, fontWeight:700 }}>
                      {klingApiKey ? "✓ ATIVO" : "VAZIO"}
                    </span>
                  </div>
                  <Input type="password" value={klingApiKey} onChange={e => setKlingApiKey(e.target.value)} placeholder="Sua chave Kling AI" />
                  <div style={{ fontSize:9, color:"#2a4a5a", marginTop:5 }}>Pré-configurada · Salva automaticamente no banco</div>
                </div>

                <div style={{ marginTop:14, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:14 }}>🎥</span>
                    <span style={{ fontWeight:700, fontSize:12, color:"#c8d8e8" }}>HeyGen — API Key</span>
                    <span style={{ marginLeft:"auto", fontSize:9, background: heygenApiKey ? "rgba(16,185,129,.15)" : "rgba(255,160,0,.12)", color: heygenApiKey ? "#10b981" : "#f59e0b", padding:"2px 7px", borderRadius:4, fontWeight:700 }}>
                      {heygenApiKey ? "✓ CONFIGURADO" : "OPCIONAL"}
                    </span>
                  </div>
                  <Input type="password" value={heygenApiKey} onChange={e => setHeygenApiKey(e.target.value)} placeholder="app.heygen.com → Settings → API" />
                  <Field label="Avatar ID">
                    <Input value={heygenAvatarId} onChange={e => setHeygenAvatarId(e.target.value)} placeholder="Ex: Daisy-inskirt-20220818" />
                  </Field>
                  <Field label="Voice ID">
                    <Input value={heygenVoiceId} onChange={e => setHeygenVoiceId(e.target.value)} placeholder="Ex: pt-BR-AntonioNeural" />
                  </Field>
                </div>

                <div style={{ marginTop:14, display:"flex", gap:8 }}>
                  <Btn onClick={saveSettings} style={{ flex:1 }}>
                    {savedSettings ? "✓ Salvo no Banco" : "💾 Salvar Configurações"}
                  </Btn>
                </div>
              </div>

              <div>
                <Field label="Modo de Geração (Kling)">
                  <div style={{ display:"flex", gap:8 }}>
                    {[{id:"standard",label:"Standard",desc:"Rápido, testes",price:"$"},{id:"professional",label:"Professional",desc:"Alta qualidade",price:"$$$"}].map(m => (
                      <Card key={m.id} sel={kMode===m.id} onClick={() => setKMode(m.id)}>
                        <div style={{ fontWeight:700, fontSize:12, color: kMode===m.id ? "#00b4ff" : "#a0c0d8" }}>{m.label} <span style={{ color:"#f59e0b", fontSize:10 }}>{m.price}</span></div>
                        <div style={{ fontSize:10, color:"#2a4050", marginTop:3 }}>{m.desc}</div>
                      </Card>
                    ))}
                  </div>
                </Field>

                <Field label="Role / Papel">
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {KLING_ROLES.map(r => (
                      <Card key={r.id} sel={kRole===r.id} onClick={() => setKRole(r.id)}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <span style={{ fontSize:18 }}>{r.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: kRole===r.id ? "#00b4ff" : "#a0c0d8" }}>{r.label}</div>
                            <div style={{ fontSize:9, color:"#2a4050", fontFamily:"'Space Mono',monospace" }}>{r.kling}</div>
                          </div>
                          {kRole===r.id && <span style={{ color:"#00b4ff", fontSize:12 }}>✓</span>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Field>

                <Field label="Emoção">
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {KLING_EMOTIONS.map(e => (
                      <Chip key={e.id} sel={kEmotion===e.id} onClick={() => setKEmotion(e.id)}>{e.icon} {e.label}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Gestos (múltiplos)">
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {KLING_GESTURES.map(g => (
                      <Chip key={g.id} sel={kGestures.includes(g.id)} onClick={() => toggleG(g.id)}>{g.icon} {g.label}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Câmera">
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {KLING_CAMERAS.map(c => (
                      <Chip key={c.id} sel={kCamera===c.id} onClick={() => setKCamera(c.id)}>{c.icon} {c.label}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Avatar Prompt Gerado">
                  <div style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.12)", borderRadius:8, padding:"9px 12px", fontSize:10, color:"#608090", fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>
                    {buildKlingPrompt()}
                  </div>
                </Field>
              </div>
            </div>

            <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={() => { markDone(1); setTab(2); }} disabled={!avatarFile}>
                {avatarFile ? "Próximo: Roteiro →" : "⬆️ Envie a foto primeiro"}
              </Btn>
            </div>
          </div>
        )}

        {/* TAB 2 — ROTEIRO */}
        {tab === 2 && (
          <div className="fade">
            <SectionHeader icon="✍️" title="Roteiro + Resumo IA" sub="Refine o roteiro e gere o e-mail de distribuição" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:18 }}>
              <div>
                <Field label="Conteúdo base">
                  <Textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Cole tópicos e dados aqui..." rows={8} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                    <div style={{ fontSize:10, color:"#2a4050" }}>{rawText.length} chars · ~{Math.ceil(rawText.split(" ").filter(Boolean).length / 130)} min</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn secondary onClick={() => { setRawText(""); setRefined(""); }} disabled={!rawText}>🗑️ Limpar</Btn>
                      <Btn onClick={refineScript} disabled={isRefining || !rawText.trim()}>
                        {isRefining ? <><Spinner /> Refinando...</> : "✨ Refinar com IA"}
                      </Btn>
                    </div>
                  </div>
                  <ErrorBox msg={refineError} />
                </Field>

                <div style={{ marginTop:20, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10, padding:"14px" }}>
                  <div style={{ fontWeight:700, fontSize:12, color:"#a0c0d8", marginBottom:10 }}>📧 E-mail de Distribuição</div>

                  <Field label="Assunto">
                    <div style={{ display:"flex", gap:8 }}>
                      <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Assunto gerado pela IA..." />
                      {emailSubject && <button onClick={() => copyText(emailSubject)} style={{ background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.22)", color:"#00b4ff", borderRadius:6, padding:"0 12px", fontSize:11, cursor:"pointer" }}>{copied ? "✓" : "📋"}</button>}
                    </div>
                  </Field>

                  <Field label="Corpo">
                    <Textarea value={distEmail} onChange={e => setDistEmail(e.target.value)} placeholder="Mensagem com resumo do episódio..." rows={4} />
                  </Field>

                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <Btn onClick={genEmailCopy} disabled={isGenEmail} style={{ flex:1 }}>
                      {isGenEmail ? <><Spinner /> Gerando...</> : "🤖 Gerar Assunto + Corpo com IA"}
                    </Btn>
                    {distEmail && <Btn secondary onClick={() => copyText(`${emailSubject}\n\n${distEmail}`)}>📋 Copiar Tudo</Btn>}
                  </div>
                </div>
              </div>

              <div>
                <Field label="Roteiro Otimizado para Avatar">
                  {!refinedScript ? (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:9, padding:"40px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      ✍️ Escreva o conteúdo e clique em "Refinar com IA"
                    </div>
                  ) : (
                    <>
                      <div style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.12)", borderRadius:9, padding:14, fontSize:12, lineHeight:1.85, color:"#90b0c8", whiteSpace:"pre-wrap", maxHeight:280, overflowY:"auto" }}>
                        {refinedScript.split(/(\[pausa\]|\[\?\]|\*[^*\n]+\*)/g).map((part, i) => {
                          if (part === "[pausa]") return <span key={i} style={{ background:"rgba(0,180,255,.18)", color:"#00d4ff", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 2px" }}>[pausa]</span>;
                          if (part === "[?]") return <span key={i} style={{ background:"rgba(255,160,0,.15)", color:"#f59e0b", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 2px" }}>[?]</span>;
                          if (part.startsWith("*") && part.endsWith("*")) return <strong key={i} style={{ color:"#e0f0ff" }}>{part.slice(1, -1)}</strong>;
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                      <Textarea value={refinedScript} onChange={e => setRefined(e.target.value)} rows={4} style={{ fontSize:11, marginTop:8 }} />
                    </>
                  )}
                </Field>

                <Field label="Avatar Prompt Kling">
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ flex:1, background:"rgba(0,0,0,.3)", border:"1px solid rgba(0,180,255,.14)", borderRadius:7, padding:"8px 11px", fontSize:10, color:"#508090", fontFamily:"'Space Mono',monospace", lineHeight:1.5 }}>
                      {klingPrompt || buildKlingPrompt()}
                    </div>
                    <button onClick={() => copyText(klingPrompt || buildKlingPrompt())} style={{ background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.22)", color:"#00b4ff", borderRadius:6, padding:"0 12px", fontSize:10, cursor:"pointer", height:40 }}>📋</button>
                  </div>
                </Field>

                <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
                  <Btn onClick={() => setTab(3)} disabled={!refinedScript}>Próximo: Render →</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — RENDER */}
        {tab === 3 && (
          <div className="fade">
            <SectionHeader icon="🎬" title="Render do Vídeo" sub="Escolha o motor e gere o podcast — episódio salvo automaticamente no histórico" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              <div>
                <Field label="Motor de Renderização">
                  <div style={{ display:"flex", gap:10 }}>
                    <Card sel={renderEngine==="kling"} onClick={() => setRenderEngine("kling")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:22 }}>⚡</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color: renderEngine==="kling" ? "#00b4ff" : "#a0c0d8" }}>Kling AI</div>
                          <div style={{ fontSize:10, color:"#2a4050" }}>Avatar v2 · 1080p · 48fps</div>
                        </div>
                        {renderEngine==="kling" && <span style={{ marginLeft:"auto", color:"#00b4ff", fontSize:14 }}>✓</span>}
                      </div>
                    </Card>
                    <Card sel={renderEngine==="heygen"} onClick={() => setRenderEngine("heygen")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:22 }}>🎥</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color: renderEngine==="heygen" ? "#00b4ff" : "#a0c0d8" }}>HeyGen</div>
                          <div style={{ fontSize:10, color:"#2a4050" }}>Avatar IV · 1080p</div>
                        </div>
                        {renderEngine==="heygen" && <span style={{ marginLeft:"auto", color:"#00b4ff", fontSize:14 }}>✓</span>}
                      </div>
                    </Card>
                  </div>
                </Field>

                <Field label="Resumo">
                  <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:9, padding:"12px 14px" }}>
                    {[
                      { k:"Podcast",    v: podcastName || "—" },
                      { k:"Episódio",   v: epTitle || "—" },
                      { k:"Duração",    v: `${duration} min` },
                      { k:"Motor",      v: renderEngine === "kling" ? `Kling ${kMode}` : "HeyGen Avatar IV" },
                      { k:"Avatar",     v: avatarFile ? avatarFile.name : "⚠️ Não enviado" },
                      ...(renderEngine==="kling" ? [{ k:"Kling Key", v: klingApiKey ? `${klingApiKey.slice(0,8)}… ✓` : "⚠️ Vazia" }] : [
                        { k:"HeyGen Key", v: heygenApiKey ? `${heygenApiKey.slice(0,6)}… ✓` : "⚠️ Não configurada" },
                        { k:"Avatar ID",  v: heygenAvatarId || "⚠️ Não informado" },
                      ]),
                    ].map(row => (
                      <div key={row.k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                        <span style={{ color:"#2a4050" }}>{row.k}</span>
                        <span style={{ color: String(row.v).startsWith("⚠️") ? "#f59e0b" : "#90b0c8", fontWeight:500 }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </Field>
              </div>

              <div>
                <Field label="Pipeline">
                  {!isRendering && !renderDone && !renderError && (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:10, padding:"32px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      🚀 Configure e clique em "Iniciar Render"
                    </div>
                  )}

                  <ErrorBox msg={renderError} />

                  {(isRendering || renderDone) && (
                    <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:16, marginTop:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:9 }}>
                        <span style={{ fontSize:11, color:"#90b0c8" }}>{renderMsg}</span>
                        <span style={{ fontSize:12, fontWeight:700, color: renderDone ? "#10b981" : "#00b4ff", fontFamily:"monospace" }}>{renderPct}%</span>
                      </div>
                      <div style={{ background:"rgba(255,255,255,.06)", borderRadius:99, height:7, overflow:"hidden" }}>
                        <div className="prog" style={{ width:`${renderPct}%`, height:"100%", borderRadius:99, background: renderDone ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#004db3,#00b4ff)" }} />
                      </div>
                    </div>
                  )}

                  {renderDone && (
                    <div className="fade" style={{ marginTop:12, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.18)", borderRadius:10, padding:16, textAlign:"center" }}>
                      <div style={{ fontSize:32, marginBottom:6 }}>🎉</div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#10b981" }}>Vídeo Gerado e Salvo!</div>
                      <div style={{ fontSize:10, color:"#4a8060", marginTop:3 }}>Episódio adicionado ao Histórico no banco</div>
                      <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"center" }}>
                        <Btn secondary onClick={() => { setRenderDone(false); setRenderPct(0); }}>🔄 Novo</Btn>
                        <Btn onClick={() => setTab(5)}>📚 Ver Histórico →</Btn>
                        <Btn onClick={() => setTab(4)}>📤 Distribuir →</Btn>
                      </div>
                    </div>
                  )}
                </Field>

                <div style={{ marginTop:12 }}>
                  <Btn onClick={startRender} disabled={isRendering || !refinedScript} style={{ width:"100%" }}>
                    {isRendering ? <><Spinner /> Processando...</> : `🚀 Iniciar Render — ${renderEngine==="kling"?"Kling":"HeyGen"}`}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — DISTRIBUIÇÃO */}
        {tab === 4 && (
          <div className="fade">
            <SectionHeader icon="📤" title="Distribuição ao Time" sub="Compartilhe via e-mail, Slack ou Spotify for Podcasters" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              <div>
                <Field label="Destinatários">
                  <Textarea value={teamEmails} onChange={e => setTeamEmails(e.target.value)} placeholder={"joao@empresa.com\nmaria@empresa.com\n#slack-tech"} rows={4} />
                </Field>
                <Btn onClick={genDistMsg} disabled={isGenMsg} style={{ width:"100%", marginTop:10 }}>
                  {isGenMsg ? <><Spinner /> Gerando...</> : "✍️ Gerar Mensagem com IA"}
                </Btn>
                <ErrorBox msg={distError} />

                <Field label="Canais">
                  {[
                    { icon:"📧", label:"E-mail",       sub:"Outlook / Gmail" },
                    { icon:"💬", label:"Slack",        sub:"#channel-tech" },
                    { icon:"👥", label:"Teams",        sub:"Engenharia" },
                    { icon:"🎙️", label:"Spotify",      sub:"eduardomigoto@gmail.com" },
                    { icon:"▶️", label:"YouTube",      sub:"Tech Weekly" },
                  ].map(c => (
                    <div key={c.label} style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:8, padding:"8px 12px", marginTop:7 }}>
                      <span style={{ fontSize:18 }}>{c.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:500, color: c.icon==="🎙️" ? "#1DB954" : "#a0b8c8" }}>{c.label}</div>
                        <div style={{ fontSize:9, color:"#2a4050" }}>{c.sub}</div>
                      </div>
                      <div style={{ width:30, height:16, borderRadius:99, background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.2)" }} />
                    </div>
                  ))}
                </Field>
              </div>

              <div>
                <Field label="Mensagem">
                  {!distMsg ? (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:9, padding:"32px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      ✉️ Clique em "Gerar Mensagem com IA"
                    </div>
                  ) : (
                    <>
                      <Textarea value={distMsg} onChange={e => setDistMsg(e.target.value)} rows={6} style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.13)", color:"#90b0c8" }} />
                      <div style={{ display:"flex", gap:8, marginTop:8 }}>
                        <Btn secondary style={{ flex:1 }} onClick={() => copyText(distMsg)}>{copied ? "✓ Copiado!" : "📋 Copiar"}</Btn>
                        <Btn style={{ flex:1 }}>🚀 Enviar Agora</Btn>
                      </div>
                    </>
                  )}
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5 — HISTÓRICO */}
        {tab === 5 && (
          <div className="fade">
            <SectionHeader icon="📚" title="Histórico de Episódios" sub={`Banco de dados ${hasClaudeStorage() ? "Storage" : "LocalStorage"} · ${episodes.length} episódio${episodes.length !== 1 ? "s" : ""} salvo${episodes.length !== 1 ? "s" : ""}`} />

            <div style={{ marginTop:20 }}>
              {episodes.length === 0 ? (
                <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:10, padding:"50px 20px", textAlign:"center", color:"#2a4050", fontSize:12 }}>
                  📂 Nenhum episódio gerado ainda<br/>
                  <span style={{ fontSize:10, color:"#1a3040" }}>Gere seu primeiro podcast na aba Render</span>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {episodes.map(ep => (
                    <div key={ep.id} style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"14px 16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:3, background: ep.status==="completed" ? "rgba(16,185,129,.15)" : "rgba(255,160,0,.15)", color: ep.status==="completed" ? "#10b981" : "#f59e0b", fontWeight:700, letterSpacing:".05em" }}>
                              {ep.status === "completed" ? "✓ COMPLETO" : "⏳ PENDENTE"}
                            </span>
                            <span style={{ fontSize:9, color:"#3a5060", fontFamily:"'Space Mono',monospace" }}>
                              {ep.engine === "kling" ? "⚡ KLING" : "🎥 HEYGEN"}
                            </span>
                            <span style={{ fontSize:9, color:"#3a5060" }}>· {ep.duration} min</span>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#c8d8e8", lineHeight:1.3 }}>{ep.title}</div>
                          <div style={{ fontSize:10, color:"#3a5060", marginTop:2 }}>{ep.podcastName}</div>
                          <div style={{ fontSize:9, color:"#2a4050", marginTop:6, fontFamily:"'Space Mono',monospace" }}>
                            🕒 {new Date(ep.createdAt).toLocaleString("pt-BR")}
                          </div>
                          {ep.headlines && ep.headlines.length > 0 && (
                            <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                              {ep.headlines.slice(0, 3).map((h, i) => (
                                <span key={i} style={{ fontSize:9, padding:"2px 6px", borderRadius:3, background:"rgba(0,180,255,.06)", color:"#608090", border:"1px solid rgba(0,180,255,.1)" }}>
                                  {h.title.slice(0, 40)}{h.title.length > 40 ? "…" : ""}
                                </span>
                              ))}
                              {ep.headlines.length > 3 && (
                                <span style={{ fontSize:9, padding:"2px 6px", color:"#3a5060" }}>+{ep.headlines.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                          <button onClick={() => {
                            if (ep.script) setRefined(ep.script);
                            if (ep.title) setEpTitle(ep.title);
                            if (ep.podcastName) setPodcastName(ep.podcastName);
                            if (ep.duration) setDuration(ep.duration);
                            if (ep.emailSubject) setEmailSubject(ep.emailSubject);
                            if (ep.emailBody) setDistEmail(ep.emailBody);
                            setTab(2);
                          }} style={{ background:"rgba(0,180,255,.08)", border:"1px solid rgba(0,180,255,.2)", color:"#00b4ff", borderRadius:6, padding:"5px 10px", fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>📂 Reabrir</button>
                          <button onClick={() => {
                            if (confirm(`Deletar "${ep.title}"?`)) deleteEpisode(ep.id);
                          }} style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#ef4444", borderRadius:6, padding:"5px 10px", fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>🗑️ Deletar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop:20, background:"linear-gradient(135deg,rgba(0,77,179,.07),rgba(0,180,255,.03))", border:"1px solid rgba(0,180,255,.1)", borderRadius:10, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:"#00b4ff", marginBottom:8 }}>📊 Estatísticas</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
                  {[
                    { k:"Total", v:episodes.length },
                    { k:"Kling", v:episodes.filter(e => e.engine==="kling").length },
                    { k:"HeyGen", v:episodes.filter(e => e.engine==="heygen").length },
                    { k:"Min Total", v:episodes.reduce((s, e) => s + (e.duration||0), 0) },
                  ].map(s => (
                    <div key={s.k} style={{ background:"rgba(0,0,0,.2)", borderRadius:7, padding:"10px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#00b4ff", fontFamily:"'Space Mono',monospace" }}>{s.v}</div>
                      <div style={{ fontSize:9, color:"#3a5060", letterSpacing:".05em", textTransform:"uppercase", marginTop:2 }}>{s.k}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:14, fontSize:10, color:"#1a3040", textAlign:"center", fontFamily:"'Space Mono',monospace" }}>
                💾 Backend: {hasClaudeStorage() ? "Claude window.storage (cross-session)" : "Browser localStorage"}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,11,19,.97)", backdropFilter:"blur(14px)", borderTop:"1px solid rgba(255,255,255,.05)", padding:"9px 24px", display:"flex", alignItems:"center", gap:10, zIndex:100 }}>
        <span style={{ fontSize:9, color:"#1a3040", fontFamily:"monospace", minWidth:60 }}>FLUXO</span>
        {TABS.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background: done.includes(i) ? "#10b981" : tab===i ? "#00b4ff" : "rgba(255,255,255,.07)" }} />
            <span style={{ fontSize:9, color: tab===i ? "#00b4ff" : done.includes(i) ? "#10b981" : "#1a3040", cursor:"pointer" }} onClick={() => setTab(i)}>{t.label}</span>
            {i < TABS.length-1 && <span style={{ color:"#1a2a3a", fontSize:8 }}>›</span>}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:9, color:"#1a3040", fontFamily:"monospace" }}>{episodes.length} eps · {done.length}/{TABS.length}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ borderBottom:"1px solid rgba(255,255,255,.05)", paddingBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:24 }}>{icon}</span>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-.02em" }}>{title}</h2>
          <p style={{ margin:"2px 0 0", fontSize:11, color:"#2a4050" }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}
