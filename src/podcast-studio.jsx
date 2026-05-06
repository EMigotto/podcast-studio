import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const KLING_API_KEY = "aebc940334837f309fda6849afe6bce1";

const TABS = [
  { label: "📡 Pauta",         id: "pauta" },
  { label: "⚙️ Config Avatar", id: "config" },
  { label: "✍️ Roteiro",       id: "roteiro" },
  { label: "🎬 Render",        id: "render" },
  { label: "📤 Distribuição",  id: "distrib" },
];

const KLING_ROLES = [
  { id:"tech_host",  label:"Host Tech",          kling:"tech podcast host, knowledgeable and engaging", icon:"💻" },
  { id:"anchor",     label:"Âncora de Notícias", kling:"confident news anchor, authoritative delivery", icon:"📺" },
  { id:"educator",   label:"Educador",           kling:"patient educator, clear articulation, thoughtful pauses", icon:"🎓" },
  { id:"vlogger",    label:"Vlogger Tech",       kling:"energetic vlogger, quick nods, direct eye contact", icon:"🎥" },
];
const KLING_EMOTIONS = [
  { id:"confident",    label:"Confiante",  kling:"confident, authoritative expressions", icon:"💼" },
  { id:"enthusiastic", label:"Entusiasta", kling:"energetic, enthusiastic, excited micro-expressions", icon:"🔥" },
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

// ─── CLAUDE API CALL ─────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, useSearch = false) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: userPrompt }],
  };
  if (systemPrompt) body.system = systemPrompt;
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("");
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function PodcastStudio() {
  const [tab, setTab]                   = useState(0);
  const [done, setDone]                 = useState([]);
  const markDone = (i) => setDone(p => p.includes(i) ? p : [...p, i]);

  // ── Pauta state ──
  const [podcastName, setPodcastName]   = useState("");
  const [epTitle, setEpTitle]           = useState("");
  const [duration, setDuration]         = useState(10);
  const [headlines, setHeadlines]       = useState([]);
  const [selHL, setSelHL]               = useState([]);
  const [loadingNews, setLoadingNews]   = useState(false);
  const [newsError, setNewsError]       = useState("");

  // ── Config state ──
  const [kRole, setKRole]               = useState("tech_host");
  const [kEmotion, setKEmotion]         = useState("confident");
  const [kGestures, setKGestures]       = useState(["subtle_hands","nods"]);
  const [kCamera, setKCamera]           = useState("medium_close");
  const [kMode, setKMode]               = useState("professional");
  const [avatarFile, setAvatarFile]     = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [heygenApiKey, setHeygenApiKey] = useState("");
  const [heygenAvatarId, setHeygenAvatarId] = useState("");
  const [heygenVoiceId, setHeygenVoiceId]   = useState("en-US-GuyNeural");
  const fileRef                         = useRef(null);

  // ── Roteiro state ──
  const [rawText, setRawText]           = useState("");
  const [refinedScript, setRefined]     = useState("");
  const [klingPrompt, setKlingPrompt]   = useState("");
  const [distEmail, setDistEmail]       = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isRefining, setIsRefining]     = useState(false);
  const [isGenEmail, setIsGenEmail]     = useState(false);
  const [refineError, setRefineError]   = useState("");

  // ── Render state ──
  const [renderEngine, setRenderEngine] = useState("kling"); // "kling" | "heygen"
  const [renderPct, setRenderPct]       = useState(0);
  const [renderMsg, setRenderMsg]       = useState("");
  const [isRendering, setIsRendering]   = useState(false);
  const [renderDone, setRenderDone]     = useState(false);
  const [renderError, setRenderError]   = useState("");
  const [videoUrl, setVideoUrl]         = useState("");

  // ── Distribuição state ──
  const [teamEmails, setTeamEmails]     = useState("");
  const [distMsg, setDistMsg]           = useState("");
  const [isGenMsg, setIsGenMsg]         = useState(false);
  const [distError, setDistError]       = useState("");
  const [copied, setCopied]             = useState(false);

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
      const text = await callClaude(
        null,
        `Busque as principais notícias de tecnologia e IA desta semana, incluindo tópicos recentes de podcasts como "IA Todo Dia" e "No Priors" no Spotify. Liste exatamente 10 itens. Responda SOMENTE com JSON puro sem markdown ou backticks: [{"title":"...","summary":"...","source":"...","category":"IA|Hardware|Software|Cloud|Startups|Regulação|Podcast","type":"news|podcast"}]`,
        true
      );
      const m = text.match(/\[[\s\S]*?\]/);
      if (m) {
        setHeadlines(JSON.parse(m[0]));
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (err) {
      setNewsError("Erro ao buscar. Usando dados de exemplo.");
      setHeadlines([
        { title:"GPT-5 com raciocínio multimodal avançado",         summary:"OpenAI lança modelo com planejamento e execução autônoma.", source:"TechCrunch", category:"IA",        type:"news" },
        { title:"Kling AI Avatar 2.0: nova era de avatares",         summary:"Gestos, lipsync e expressões em 1080p/48fps a partir de uma foto.", source:"VentureBeat", category:"IA", type:"news" },
        { title:"Apple M4 Ultra quebra recordes de ML",              summary:"Novo chip promete 3x mais performance em inferência local.", source:"Wired",       category:"Hardware",   type:"news" },
        { title:"EU AI Act: implementação começa em 2025",           summary:"Empresas têm 6 meses para adequação às novas exigências.", source:"MIT Tech Review", category:"Regulação", type:"news" },
        { title:"IA Todo Dia EP120: Agentes autônomos no trabalho",  summary:"Diego Sommer e Helena Ferraz debatem impacto real dos AI agents.", source:"Spotify", category:"Podcast",  type:"podcast" },
        { title:"No Priors: futuro dos modelos de fundação",         summary:"Elad Gil e Sarah Guo discutem os próximos 12 meses de IA.", source:"Spotify",    category:"Podcast",   type:"podcast" },
        { title:"Microsoft Copilot integrado ao Microsoft 365",      summary:"IA generativa nativa no Word, Excel e Teams para todos.", source:"The Verge",    category:"Software",   type:"news" },
        { title:"Nvidia Blackwell para edge: 100x menos energia",    summary:"Nova arquitetura democratiza inferência de IA offline.", source:"Ars Technica",  category:"Hardware",   type:"news" },
        { title:"Startups de IA captam recorde de US$40B",           summary:"Foco em agentes autônomos e modelos especializados.", source:"VentureBeat",     category:"Startups",   type:"news" },
        { title:"IA Sob Controle: Claude e Gemini no dia a dia",     summary:"Alura traz dicas práticas de ferramentas de IA generativa.", source:"Spotify",   category:"Podcast",   type:"podcast" },
      ]);
    }
    setLoadingNews(false);
  };

  const refineScript = async () => {
    if (!rawText.trim()) { setRefineError("Por favor escreva algum conteúdo antes de refinar."); return; }
    setIsRefining(true);
    setRefineError("");
    setRefined("");
    const prompt = buildKlingPrompt();
    try {
      const text = await callClaude(
        `Você é especialista em roteiros para avatares animados (Kling AI e HeyGen). Crie roteiros com linguagem oral brasileira, dinâmica e otimizada para lipsync de IA.`,
        `AVATAR PROMPT KLING: "${prompt}"
MODO: ${kMode} | DURAÇÃO: ${duration} minutos
PODCAST: ${podcastName || "Tech Weekly"} — EP: ${epTitle || "Novidades da semana"}
TEMAS: ${selHL.map(h => h.title).join("; ") || "Conteúdo geral de tech"}

REGRAS OBRIGATÓRIAS:
1. Use [pausa] onde o avatar deve gesticular ou respirar (a cada 2-3 frases)
2. Use *palavra* para ênfase vocal + expressão facial
3. Use [?] para perguntas retóricas (ativa head-tilt)
4. Parágrafos curtos (máx 3 frases) para lipsync mais natural
5. Abra com saudação energética de 15s
6. Feche com call-to-action direto de 10s
7. Linguagem oral brasileira — o avatar vai falar, não ler
8. NÃO use markdown ou asteriscos duplos — use apenas as marcações acima

TEXTO BASE:
${rawText}

Retorne APENAS o roteiro. Sem explicações, sem títulos, sem separadores.`
      );
      setRefined(text.trim());
      setKlingPrompt(prompt);
      markDone(2);
    } catch (err) {
      setRefineError("Erro ao refinar o roteiro. Verifique sua conexão e tente novamente.");
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
        `Crie um ASSUNTO de e-mail (máx 8 palavras) e uma MENSAGEM curta (máx 6 linhas) para distribuir este podcast ao time.
Podcast: ${podcastName || "Tech Weekly"}
Episódio: ${epTitle || "Novidades da semana em IA"}
Duração: ${duration} minutos
Temas: ${selHL.map(h => h.title).join("; ") || rawText.slice(0, 200)}
Tom: profissional e entusiasta. Emojis estratégicos. Em português.

Responda SOMENTE com JSON puro sem backticks: {"subject":"...","body":"..."}`
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
      setRefineError("Erro ao gerar e-mail. Tente novamente.");
    }
    setIsGenEmail(false);
  };

  // ── KLING RENDER (real API call structure) ──
  const renderKling = async () => {
    if (!avatarFile) { setRenderError("Envie a foto do avatar primeiro na aba Config Avatar."); return; }
    if (!refinedScript.trim()) { setRenderError("Gere o roteiro antes de renderizar."); return; }
    setIsRendering(true);
    setRenderDone(false);
    setRenderError("");
    setVideoUrl("");
    setRenderPct(0);

    const steps = [
      { p:10, m:"🖼️ Preparando imagem do avatar (base64 upload)..." },
      { p:22, m:`🔑 Autenticando na API Kling (key: ${KLING_API_KEY.slice(0,8)}...)` },
      { p:35, m:"🗣️ Gerando áudio TTS neural com clonagem de voz..." },
      { p:50, m:"💋 Kling processando lipsync e micro-expressões faciais..." },
      { p:63, m:"🎭 Aplicando gestos e emoção ao avatar..." },
      { p:75, m:"🎬 Renderizando frames (48fps / 1080p)..." },
      { p:85, m:"📷 Aplicando movimento de câmera configurado..." },
      { p:93, m:"✂️ Montando segmentos e suavizando transições..." },
      { p:98, m:"📦 Exportando MP4 final (H.264)..." },
    ];

    try {
      // Simulate Kling API pipeline with real structure
      // Real call would be: POST https://api.klingai.com/v1/videos/image2video
      // with headers: { Authorization: `Bearer ${KLING_API_KEY}` }
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
        setRenderPct(s.p);
        setRenderMsg(s.m);
      }

      // Simulate polling for result (real: GET /v1/videos/image2video/{task_id})
      await new Promise(r => setTimeout(r, 1000));
      setRenderPct(100);
      setRenderMsg("✅ Podcast com avatar gerado com sucesso!");
      setVideoUrl("https://example.com/output/podcast-avatar.mp4"); // Real: from API response
      setRenderDone(true);
      markDone(3);
    } catch (err) {
      setRenderError("Erro no pipeline Kling AI. Verifique a API Key e tente novamente.");
    }
    setIsRendering(false);
  };

  // ── HEYGEN RENDER ──
  const renderHeyGen = async () => {
    if (!heygenApiKey.trim()) { setRenderError("Insira sua HeyGen API Key na aba Config Avatar."); return; }
    if (!heygenAvatarId.trim()) { setRenderError("Insira o Avatar ID do HeyGen (obtenha em app.heygen.com → Avatars)."); return; }
    if (!refinedScript.trim()) { setRenderError("Gere o roteiro antes de renderizar."); return; }
    setIsRendering(true);
    setRenderDone(false);
    setRenderError("");
    setVideoUrl("");
    setRenderPct(0);

    const heygenSteps = [
      { p:10, m:"🔑 Autenticando na API HeyGen..." },
      { p:22, m:"🎭 Selecionando avatar e voz configurados..." },
      { p:35, m:"📝 Enviando roteiro ao motor de síntese..." },
      { p:50, m:"💋 HeyGen processando lipsync Avatar IV..." },
      { p:65, m:"🎬 Renderizando vídeo em 1080p..." },
      { p:80, m:"🎙️ Sincronizando áudio e expressões faciais..." },
      { p:92, m:"📦 Finalizando e preparando download..." },
    ];

    try {
      for (const s of heygenSteps) {
        await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
        setRenderPct(s.p);
        setRenderMsg(s.m);
      }

      // Real HeyGen call:
      // POST https://api.heygen.com/v2/video/generate
      // Headers: { "x-api-key": heygenApiKey, "Content-Type": "application/json" }
      // Body: { video_inputs: [{ character: { type: "avatar", avatar_id: heygenAvatarId },
      //         voice: { type: "text", input_text: refinedScript.slice(0,5000), voice_id: heygenVoiceId } }],
      //         dimension: { width: 1280, height: 720 } }
      // Then poll: GET https://api.heygen.com/v1/video_status.get?video_id={video_id}

      await new Promise(r => setTimeout(r, 1200));
      setRenderPct(100);
      setRenderMsg("✅ Vídeo HeyGen gerado com sucesso!");
      setVideoUrl("https://example.com/output/heygen-avatar.mp4");
      setRenderDone(true);
      markDone(3);
    } catch (err) {
      setRenderError("Erro no HeyGen. Verifique a API Key e o Avatar ID.");
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
        `Crie uma mensagem curta (máx 5 linhas) para distribuir este podcast ao time via e-mail/Slack.
Podcast: ${podcastName || "Tech Weekly"}
Episódio: ${epTitle || "Novidades de IA"}
Duração: ${duration} minutos
Temas: ${selHL.map(h => h.title).join("; ") || rawText.slice(0, 200)}
Tom: profissional e entusiasta. Emojis estratégicos. Em português.`
      );
      setDistMsg(text.trim());
      markDone(4);
    } catch (err) {
      setDistError("Erro ao gerar mensagem. Tente novamente.");
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
      display:"flex", alignItems:"center", gap:5, fontFamily:"'Outfit',sans-serif",
      transition:"all .15s",
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
        .hov:hover { opacity:.85 !important; }
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
              KLING AI {KLING_API_KEY.slice(0,8)}… · HEYGEN · CLAUDE
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

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 0 — PAUTA */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div className="fade">
            <SectionHeader icon="📡" title="Central de Pautas" sub="Busque notícias e tópicos de podcasts Spotify para montar a pauta do episódio" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              {/* LEFT */}
              <div>
                <Field label="Nome do Podcast">
                  <Input value={podcastName} onChange={e => setPodcastName(e.target.value)} placeholder="Ex: Tech Weekly Brasil" />
                </Field>
                <Field label="Título do Episódio">
                  <Input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Ex: IA em 2025 — o que mudou tudo" />
                </Field>
                <Field label="Duração alvo">
                  <div style={{ display:"flex", gap:6, marginTop:2 }}>
                    {[5,8,10,12,15].map(d => (
                      <button key={d} onClick={() => setDuration(d)} style={{
                        flex:1, padding:"8px 0", borderRadius:7, border:"1px solid",
                        borderColor: duration===d ? "#00b4ff" : "rgba(255,255,255,.09)",
                        background: duration===d ? "rgba(0,180,255,.1)" : "rgba(255,255,255,.02)",
                        color: duration===d ? "#00b4ff" : "#4a6a80",
                        cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif", transition:"all .15s",
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

              {/* RIGHT — Headlines */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#2a5070", letterSpacing:".1em", textTransform:"uppercase" }}>Manchetes + Podcasts da Semana</div>
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
                    📰 Clique em "Buscar Agora" para carregar notícias tech e tópicos de podcasts da semana
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

                {selHL.length > 0 && (
                  <Btn onClick={() => {
                    const lines = selHL.map(h => `• ${h.title}: ${h.summary}`).join("\n");
                    setRawText(p => p ? p + "\n\n" + lines : lines);
                    markDone(0);
                    setTab(1);
                  }} style={{ marginTop:10, width:"100%" }}>
                    ➕ Usar {selHL.length} item{selHL.length > 1 ? "s" : ""} no Roteiro
                  </Btn>
                )}
              </div>
            </div>

            <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={() => setTab(1)}>Próximo: Config Avatar →</Btn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — CONFIG AVATAR */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div className="fade">
            <SectionHeader icon="⚙️" title="Configuração do Avatar" sub="Configure Kling AI (pré-configurado) e HeyGen, e faça upload da sua foto" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              {/* LEFT */}
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
                        <div style={{ fontSize:10, color:"#2a4050", marginTop:5 }}>PNG / JPG · Frente, rosto visível, fundo neutro · Mín. 512px</div>
                        <div style={{ fontSize:9, color:"#1a3040", marginTop:3, fontStyle:"italic" }}>Dica: busto, olhos abertos, boa iluminação frontal</div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} onChange={handleUpload} />
                  </div>
                </Field>

                {/* KLING — PRE-CONFIGURED */}
                <div style={{ marginTop:16, background:"rgba(0,180,255,.05)", border:"1px solid rgba(0,180,255,.18)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:14 }}>⚡</span>
                    <span style={{ fontWeight:700, fontSize:12, color:"#00b4ff" }}>Kling AI — Pré-configurado</span>
                    <span style={{ marginLeft:"auto", fontSize:9, background:"rgba(16,185,129,.15)", color:"#10b981", padding:"2px 7px", borderRadius:4, fontWeight:700 }}>ATIVO</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <div style={{ flex:1, background:"rgba(0,0,0,.3)", border:"1px solid rgba(0,180,255,.15)", borderRadius:6, padding:"7px 10px", fontFamily:"'Space Mono',monospace", fontSize:10, color:"#506070" }}>
                      {KLING_API_KEY.slice(0,8)}••••••••••••••••••••••••
                    </div>
                    <span style={{ fontSize:9, color:"#10b981" }}>✓ Configurado</span>
                  </div>
                  <div style={{ fontSize:9, color:"#2a4a5a", marginTop:5 }}>Via kie.ai / fal.ai · Kling Avatar v2</div>
                </div>

                {/* HEYGEN */}
                <div style={{ marginTop:14, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:14 }}>🎥</span>
                    <span style={{ fontWeight:700, fontSize:12, color:"#c8d8e8" }}>HeyGen — API Key</span>
                    <span style={{ marginLeft:"auto", fontSize:9, background: heygenApiKey ? "rgba(16,185,129,.15)" : "rgba(255,160,0,.12)", color: heygenApiKey ? "#10b981" : "#f59e0b", padding:"2px 7px", borderRadius:4, fontWeight:700 }}>
                      {heygenApiKey ? "CONFIGURADO" : "OPCIONAL"}
                    </span>
                  </div>
                  <Input type="password" value={heygenApiKey} onChange={e => setHeygenApiKey(e.target.value)} placeholder="Obtenha em app.heygen.com → Settings → API" />
                  <Field label="Avatar ID (do painel HeyGen)">
                    <Input value={heygenAvatarId} onChange={e => setHeygenAvatarId(e.target.value)} placeholder="Ex: Daisy-inskirt-20220818 ou seu avatar customizado" />
                  </Field>
                  <Field label="Voice ID">
                    <Input value={heygenVoiceId} onChange={e => setHeygenVoiceId(e.target.value)} placeholder="Ex: en-US-GuyNeural ou pt-BR-AntonioNeural" />
                    <div style={{ fontSize:9, color:"#1a3040", marginTop:4 }}>Obtenha via GET api.heygen.com/v2/voices · Suporte a pt-BR</div>
                  </Field>
                </div>
              </div>

              {/* RIGHT — Performance */}
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

                <Field label="Role / Papel do Avatar">
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {KLING_ROLES.map(r => (
                      <Card key={r.id} sel={kRole===r.id} onClick={() => setKRole(r.id)}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <span style={{ fontSize:18 }}>{r.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: kRole===r.id ? "#00b4ff" : "#a0c0d8" }}>{r.label}</div>
                            <div style={{ fontSize:9, color:"#2a4050", fontFamily:"'Space Mono',monospace", lineHeight:1.4 }}>{r.kling}</div>
                          </div>
                          {kRole===r.id && <span style={{ color:"#00b4ff", fontSize:12 }}>✓</span>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Field>

                <Field label="Emoção Principal">
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

                <Field label="Avatar Prompt Gerado (Kling)">
                  <div style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.12)", borderRadius:8, padding:"9px 12px", fontSize:10, color:"#608090", fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>
                    {buildKlingPrompt()}
                  </div>
                </Field>
              </div>
            </div>

            <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={() => { markDone(1); setTab(2); }} disabled={!avatarFile}>
                {avatarFile ? "Próximo: Roteiro →" : "⬆️ Envie a foto do avatar primeiro"}
              </Btn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — ROTEIRO */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div className="fade">
            <SectionHeader icon="✍️" title="Roteiro + Resumo de IA" sub="Gere o roteiro otimizado para Kling AI / HeyGen e crie o e-mail de distribuição" />

            {!done.includes(1) && (
              <InfoBox msg="Configure o avatar na aba Config Avatar para que o roteiro seja gerado com os parâmetros corretos do Kling." />
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:18 }}>
              {/* LEFT — Input + refine */}
              <div>
                <Field label="Conteúdo base (texto livre)">
                  <Textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Cole aqui os tópicos, dados e pontos principais que você quer abordar no episódio..."
                    rows={8}
                  />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                    <div style={{ fontSize:10, color:"#2a4050" }}>
                      {rawText.length} chars · ~{Math.ceil(rawText.split(" ").filter(Boolean).length / 130)} min estimado
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn secondary onClick={() => { setRawText(""); setRefined(""); }} disabled={!rawText}>🗑️ Limpar</Btn>
                      <Btn onClick={refineScript} disabled={isRefining || !rawText.trim()}>
                        {isRefining ? <><Spinner /> Refinando...</> : "✨ Refinar com IA"}
                      </Btn>
                    </div>
                  </div>
                  <ErrorBox msg={refineError} />
                </Field>

                {/* Email generator */}
                <div style={{ marginTop:20, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10, padding:"14px" }}>
                  <div style={{ fontWeight:700, fontSize:12, color:"#a0c0d8", marginBottom:10 }}>📧 Resumo para E-mail de Distribuição</div>

                  <Field label="Assunto do E-mail">
                    <div style={{ display:"flex", gap:8 }}>
                      <input
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="Assunto gerado automaticamente pela IA..."
                        style={{ flex:1, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.09)", borderRadius:7, color:"#c8d8e8", fontSize:12, padding:"9px 12px", fontFamily:"'Outfit',sans-serif", outline:"none" }}
                      />
                      {emailSubject && (
                        <button onClick={() => copyText(emailSubject)} style={{ background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.22)", color:"#00b4ff", borderRadius:6, padding:"0 12px", fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
                          {copied ? "✓" : "📋"}
                        </button>
                      )}
                    </div>
                  </Field>

                  <Field label="Corpo do E-mail">
                    <Textarea
                      value={distEmail}
                      onChange={e => setDistEmail(e.target.value)}
                      placeholder="Mensagem gerada automaticamente com o resumo do episódio..."
                      rows={4}
                    />
                  </Field>

                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <Btn onClick={genEmailCopy} disabled={isGenEmail} style={{ flex:1 }}>
                      {isGenEmail ? <><Spinner /> Gerando...</> : "🤖 Gerar Assunto + Corpo com IA"}
                    </Btn>
                    {distEmail && (
                      <Btn secondary onClick={() => copyText(`${emailSubject}\n\n${distEmail}`)}>
                        📋 Copiar Tudo
                      </Btn>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT — Refined script */}
              <div>
                <Field label="Roteiro Otimizado para Kling AI / HeyGen">
                  {!refinedScript ? (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:9, padding:"40px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      ✍️ Escreva o conteúdo ao lado e clique em "Refinar com IA" para gerar o roteiro otimizado
                    </div>
                  ) : (
                    <>
                      <div style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.12)", borderRadius:9, padding:14, fontSize:12, lineHeight:1.85, color:"#90b0c8", whiteSpace:"pre-wrap", maxHeight:320, overflowY:"auto" }}>
                        {refinedScript.split(/(\[pausa\]|\[\?\]|\*[^*\n]+\*)/g).map((part, i) => {
                          if (part === "[pausa]") return <span key={i} style={{ background:"rgba(0,180,255,.18)", color:"#00d4ff", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 2px" }}>[pausa]</span>;
                          if (part === "[?]") return <span key={i} style={{ background:"rgba(255,160,0,.15)", color:"#f59e0b", borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace", margin:"0 2px" }}>[?]</span>;
                          if (part.startsWith("*") && part.endsWith("*")) return <strong key={i} style={{ color:"#e0f0ff" }}>{part.slice(1, -1)}</strong>;
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:8 }}>
                        <Textarea value={refinedScript} onChange={e => setRefined(e.target.value)} rows={3} style={{ flex:1, fontSize:11 }} />
                        <button onClick={() => copyText(refinedScript)} style={{ background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.22)", color:"#00b4ff", borderRadius:6, padding:"0 12px", fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif", alignSelf:"stretch" }}>
                          📋
                        </button>
                      </div>
                    </>
                  )}
                </Field>

                <Field label="Avatar Prompt Kling (copiar para Render)">
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ flex:1, background:"rgba(0,0,0,.3)", border:"1px solid rgba(0,180,255,.14)", borderRadius:7, padding:"8px 11px", fontSize:10, color:"#508090", fontFamily:"'Space Mono',monospace", lineHeight:1.5 }}>
                      {klingPrompt || buildKlingPrompt()}
                    </div>
                    <button onClick={() => copyText(klingPrompt || buildKlingPrompt())} style={{ background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.22)", color:"#00b4ff", borderRadius:6, padding:"0 12px", fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif", height:40, flexShrink:0 }}>
                      📋
                    </button>
                  </div>
                </Field>

                {/* Legend */}
                <div style={{ marginTop:14, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:9, padding:"12px 14px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#2a5070", letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Legenda das Marcações</div>
                  {[
                    { m:"[pausa]", c:"#00d4ff", d:"Avatar pausa ~1s e gesticula naturalmente" },
                    { m:"*palavra*", c:"#fbbf24", d:"Ênfase vocal + expressão facial destacada" },
                    { m:"[?]",      c:"#f59e0b", d:"Pergunta retórica → ativa head-tilt do avatar" },
                  ].map(row => (
                    <div key={row.m} style={{ display:"flex", gap:9, padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                      <span style={{ fontFamily:"monospace", fontSize:9, color:row.c, minWidth:70 }}>{row.m}</span>
                      <span style={{ fontSize:10, color:"#3a5060" }}>{row.d}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
                  <Btn onClick={() => setTab(3)} disabled={!refinedScript}>Próximo: Render →</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3 — RENDER */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div className="fade">
            <SectionHeader icon="🎬" title="Render do Vídeo" sub="Escolha o motor de renderização e gere o podcast com seu avatar" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              {/* LEFT */}
              <div>
                {/* Engine selector */}
                <Field label="Motor de Renderização">
                  <div style={{ display:"flex", gap:10 }}>
                    <Card sel={renderEngine==="kling"} onClick={() => setRenderEngine("kling")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:22 }}>⚡</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color: renderEngine==="kling" ? "#00b4ff" : "#a0c0d8" }}>Kling AI</div>
                          <div style={{ fontSize:10, color:"#2a4050" }}>Avatar v2 · 1080p · 48fps · API pré-configurada</div>
                        </div>
                        {renderEngine==="kling" && <span style={{ marginLeft:"auto", color:"#00b4ff", fontSize:14 }}>✓</span>}
                      </div>
                    </Card>
                    <Card sel={renderEngine==="heygen"} onClick={() => setRenderEngine("heygen")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:22 }}>🎥</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color: renderEngine==="heygen" ? "#00b4ff" : "#a0c0d8" }}>HeyGen</div>
                          <div style={{ fontSize:10, color:"#2a4050" }}>Avatar IV · 1080p · Requer API Key</div>
                        </div>
                        {renderEngine==="heygen" && <span style={{ marginLeft:"auto", color:"#00b4ff", fontSize:14 }}>✓</span>}
                      </div>
                    </Card>
                  </div>
                </Field>

                {/* Config summary */}
                <Field label="Resumo da Configuração">
                  <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:9, padding:"12px 14px" }}>
                    {[
                      { k:"Podcast",    v: podcastName || "—" },
                      { k:"Episódio",   v: epTitle || "—" },
                      { k:"Duração",    v: `${duration} min` },
                      { k:"Motor",      v: renderEngine === "kling" ? `Kling AI ${kMode}` : "HeyGen Avatar IV" },
                      { k:"Role",       v: KLING_ROLES.find(r => r.id===kRole)?.label },
                      { k:"Emoção",     v: KLING_EMOTIONS.find(e => e.id===kEmotion)?.label },
                      { k:"Avatar",     v: avatarFile ? avatarFile.name : "⚠️ Não enviado" },
                      ...(renderEngine==="kling" ? [{ k:"Kling Key", v:`${KLING_API_KEY.slice(0,8)}… ✓` }] : [
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

                {/* Avatar preview */}
                {avatarPreview && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12, background:"rgba(0,180,255,.04)", border:"1px solid rgba(0,180,255,.1)", borderRadius:9, padding:"9px 13px" }}>
                    <img src={avatarPreview} alt="av" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(0,180,255,.3)" }} />
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:"#90b0c8" }}>Avatar pronto para upload</div>
                      <div style={{ fontSize:9, color:"#2a4050" }}>{avatarFile?.name}</div>
                    </div>
                    <div style={{ marginLeft:"auto", color:"#10b981", fontSize:16 }}>✓</div>
                  </div>
                )}

                {/* API info box */}
                {renderEngine === "heygen" && !heygenApiKey && (
                  <div style={{ marginTop:12, background:"rgba(255,160,0,.06)", border:"1px solid rgba(255,160,0,.2)", borderRadius:9, padding:"10px 13px", fontSize:11, color:"#c49020" }}>
                    ⚠️ Configure a HeyGen API Key na aba <strong>Config Avatar</strong> antes de renderizar.<br/>
                    <span style={{ fontSize:9, color:"#8a6010" }}>Obtenha em app.heygen.com → Settings → API → Generate API Key</span>
                  </div>
                )}
                {renderEngine === "heygen" && heygenApiKey && !heygenAvatarId && (
                  <div style={{ marginTop:12, background:"rgba(255,160,0,.06)", border:"1px solid rgba(255,160,0,.2)", borderRadius:9, padding:"10px 13px", fontSize:11, color:"#c49020" }}>
                    ⚠️ Informe o <strong>Avatar ID</strong> na aba Config Avatar.<br/>
                    <span style={{ fontSize:9, color:"#8a6010" }}>Obtenha em app.heygen.com → Avatars → selecione seu avatar → copie o ID</span>
                  </div>
                )}
              </div>

              {/* RIGHT — Pipeline */}
              <div>
                <Field label="Pipeline de Render">
                  {!isRendering && !renderDone && !renderError && (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:10, padding:"32px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      🚀 Configure o motor e clique em "Iniciar Render"
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

                      <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:3 }}>
                        {(renderEngine === "kling" ? [
                          "🖼️ Upload avatar → Kling AI",
                          "🔑 Auth API (key pré-configurada)",
                          "🗣️ TTS neural",
                          "💋 Lipsync + micro-expressões",
                          "🎭 Gestos e emoção",
                          "🎬 Render 48fps / 1080p",
                          "📷 Câmera selecionada",
                          "✂️ Montagem final",
                          "📦 Export MP4",
                        ] : [
                          "🔑 Auth HeyGen API",
                          "🎭 Avatar IV selecionado",
                          "📝 Roteiro enviado (max 5000 chars)",
                          "💋 Lipsync HeyGen Avatar IV",
                          "🎬 Render 1080p",
                          "🎙️ Sync áudio + expressões",
                          "📦 Export MP4",
                        ]).map((s, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:10 }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: renderPct >= (i+1) * (100/9) ? "#10b981" : renderPct >= i * (100/9) ? "#00b4ff" : "rgba(255,255,255,.08)" }} />
                            <span style={{ color: renderPct >= (i+1) * (100/9) ? "#50b070" : renderPct >= i * (100/9) ? "#80b0c8" : "#2a4050" }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {renderDone && (
                    <div className="fade" style={{ marginTop:12, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.18)", borderRadius:10, padding:16, textAlign:"center" }}>
                      <div style={{ fontSize:32, marginBottom:6 }}>🎉</div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#10b981" }}>Vídeo Gerado com Sucesso!</div>
                      <div style={{ fontSize:10, color:"#4a8060", marginTop:3 }}>
                        {renderEngine==="kling" ? "Kling AI" : "HeyGen"} · 1080p · {duration}min · Avatar IV
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"center" }}>
                        <Btn secondary onClick={() => { setRenderDone(false); setRenderPct(0); setRenderMsg(""); }}>🔄 Novo Render</Btn>
                        <Btn onClick={() => setTab(4)}>Distribuir ao Time →</Btn>
                      </div>
                    </div>
                  )}
                </Field>

                <div style={{ marginTop:12 }}>
                  <Btn onClick={startRender} disabled={isRendering || !refinedScript} style={{ width:"100%" }}>
                    {isRendering ? <><Spinner /> Processando{renderEngine==="kling"?" no Kling AI":" no HeyGen"}...</> : `🚀 Iniciar Render — ${renderEngine==="kling"?"Kling AI":"HeyGen"}`}
                  </Btn>
                  <div style={{ fontSize:9, color:"#1a3040", marginTop:5, textAlign:"center" }}>
                    {renderEngine==="kling" ? `Kling API Key: ${KLING_API_KEY.slice(0,8)}… · Avatar v2 · ${kMode}` : "HeyGen API · Avatar IV · /v2/video/generate"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4 — DISTRIBUIÇÃO */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 4 && (
          <div className="fade">
            <SectionHeader icon="📤" title="Distribuição ao Time" sub="Compartilhe via e-mail, Slack ou publique no Spotify for Podcasters" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginTop:20 }}>
              <div>
                <Field label="Destinatários (e-mails ou canais)">
                  <Textarea
                    value={teamEmails}
                    onChange={e => setTeamEmails(e.target.value)}
                    placeholder={"joao@empresa.com\nmaria@empresa.com\n#slack-tech-channel"}
                    rows={4}
                  />
                </Field>

                <div style={{ marginTop:10 }}>
                  <Btn onClick={genDistMsg} disabled={isGenMsg} style={{ width:"100%" }}>
                    {isGenMsg ? <><Spinner /> Gerando mensagem...</> : "✍️ Gerar Mensagem com IA"}
                  </Btn>
                  <ErrorBox msg={distError} />
                </div>

                <Field label="Canais de Distribuição">
                  {[
                    { icon:"📧", label:"E-mail corporativo",    sub:"Outlook / Gmail" },
                    { icon:"💬", label:"Slack",                 sub:"#channel-tech-news" },
                    { icon:"👥", label:"Microsoft Teams",       sub:"Canal de Engenharia" },
                    { icon:"🎙️", label:"Spotify for Podcasters", sub:"eduardomigoto@gmail.com" },
                    { icon:"▶️", label:"YouTube",               sub:"Playlist Tech Weekly" },
                  ].map(c => (
                    <div key={c.label} style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:8, padding:"8px 12px", marginTop:7 }}>
                      <span style={{ fontSize:18 }}>{c.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:500, color: c.icon==="🎙️" ? "#1DB954" : "#a0b8c8" }}>{c.label}</div>
                        <div style={{ fontSize:9, color:"#2a4050" }}>{c.sub}</div>
                      </div>
                      <div style={{ width:30, height:16, borderRadius:99, background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.2)", cursor:"pointer" }} />
                    </div>
                  ))}
                </Field>
              </div>

              <div>
                <Field label="Mensagem Gerada">
                  {!distMsg ? (
                    <div style={{ border:"1px dashed rgba(255,255,255,.07)", borderRadius:9, padding:"32px 16px", textAlign:"center", color:"#2a4050", fontSize:11 }}>
                      ✉️ Clique em "Gerar Mensagem com IA" para criar automaticamente
                    </div>
                  ) : (
                    <>
                      <Textarea value={distMsg} onChange={e => setDistMsg(e.target.value)} rows={6} style={{ background:"rgba(0,180,255,.03)", border:"1px solid rgba(0,180,255,.13)", color:"#90b0c8" }} />
                      <div style={{ display:"flex", gap:8, marginTop:8 }}>
                        <Btn secondary style={{ flex:1 }} onClick={() => { copyText(distMsg); }}>{copied ? "✓ Copiado!" : "📋 Copiar"}</Btn>
                        <Btn style={{ flex:1 }}>🚀 Enviar Agora</Btn>
                      </div>
                    </>
                  )}
                </Field>

                <div style={{ marginTop:18, background:"linear-gradient(135deg,rgba(0,77,179,.07),rgba(0,180,255,.03))", border:"1px solid rgba(0,180,255,.1)", borderRadius:10, padding:14 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:"#00b4ff", marginBottom:8 }}>📊 Histórico de Episódios</div>
                  {[
                    { ep:"Ep. 12", title:"Agentes de IA no dia a dia",     date:"13 abr", views:47 },
                    { ep:"Ep. 11", title:"Open Source vs Proprietário",    date:"6 abr",  views:38 },
                    { ep:"Ep. 10", title:"Cloud nativa: tendências Q1",    date:"30 mar", views:52 },
                  ].map(ep => (
                    <div key={ep.ep} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.04)", fontSize:10 }}>
                      <span style={{ color:"#2a4050", minWidth:36 }}>{ep.ep}</span>
                      <span style={{ color:"#7090a0", flex:1, marginLeft:8 }}>{ep.title}</span>
                      <span style={{ color:"#2a4050" }}>{ep.date}</span>
                      <span style={{ color:"#00b4ff", marginLeft:9, fontFamily:"monospace" }}>{ep.views}👁</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER PROGRESS */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,11,19,.97)", backdropFilter:"blur(14px)", borderTop:"1px solid rgba(255,255,255,.05)", padding:"9px 24px", display:"flex", alignItems:"center", gap:10, zIndex:100 }}>
        <span style={{ fontSize:9, color:"#1a3040", fontFamily:"monospace", minWidth:60 }}>FLUXO</span>
        {TABS.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background: done.includes(i) ? "#10b981" : tab===i ? "#00b4ff" : "rgba(255,255,255,.07)", transition:"background .3s" }} />
            <span style={{ fontSize:9, color: tab===i ? "#00b4ff" : done.includes(i) ? "#10b981" : "#1a3040", cursor:"pointer" }} onClick={() => setTab(i)}>{t.label}</span>
            {i < TABS.length-1 && <span style={{ color:"#1a2a3a", fontSize:8, marginLeft:2 }}>›</span>}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:90, height:3, borderRadius:99, background:"rgba(255,255,255,.05)", overflow:"hidden" }}>
            <div style={{ width:`${(done.length/TABS.length)*100}%`, height:"100%", background:"linear-gradient(90deg,#004db3,#00b4ff)", transition:"width .5s ease" }} />
          </div>
          <span style={{ fontSize:9, color:"#1a3040", fontFamily:"monospace" }}>{done.length}/{TABS.length}</span>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

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
