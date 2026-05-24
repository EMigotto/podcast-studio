// ═══════════════════════════════════════════════════════════════════════════
// Sync·MI — Serverless function for rich link previews (LinkedIn/Facebook/X/WhatsApp)
//
// WHY: social crawlers do NOT run JavaScript, so they never see the meta tags
// that a single-page React app sets at runtime. This function reads the episode
// straight from Supabase and returns *static* HTML with episode-specific Open
// Graph tags (title, description, og:image = infographic). Humans get redirected
// to the real SPA page; crawlers read the tags and render a professional card.
//
// USAGE: link people to  https://SEU-DOMINIO/api/share?date=2026-05-19
//        (the admin "Divulgação" tab generates this link for you)
//
// SETUP: set these two Environment Variables in Vercel (Project → Settings → Env):
//   SUPABASE_URL       = https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  = eyJ...   (the public anon key — same as in index.html)
// Or hardcode them in the two consts just below.
//
// NOTE: uses the Web-standard handler (Request -> Response), which does NOT
// depend on Vercel's res.status()/res.send() helpers (those are off by default
// and were the cause of the earlier FUNCTION_INVOCATION_FAILED crash).
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "";        // e.g. "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const SITE_NAME = "Sync\u00b7MI";
const DEFAULT_IMAGE_PATH = "/og-default.png"; // optional 1200x630 fallback image at project root
const DEFAULT_DESC = "Newsletter e podcast semanais de IA \u2014 curados, sucintos, sem hype.";

function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtDateLong(iso){
  if(!iso) return "";
  const M = ["janeiro","fevereiro","mar\u00e7o","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const parts = String(iso).split("-");
  if(parts.length < 3) return iso;
  const [y,m,d] = parts;
  return `${parseInt(d,10)} de ${M[parseInt(m,10)-1]} de ${y}`;
}

function buildHtml({ title, description, image, humanUrl, date }){
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(humanUrl)}">
<meta property="og:locale" content="pt_BR">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">

<link rel="canonical" href="${esc(humanUrl)}">
<meta http-equiv="refresh" content="0; url=${esc(humanUrl)}">
<script>try{window.location.replace(${JSON.stringify(humanUrl)});}catch(e){}</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#F1E9D6;color:#14110D;padding:40px;text-align:center;">
<p>Redirecionando${date ? " para a edi\u00e7\u00e3o de " + esc(fmtDateLong(date)) : ""}\u2026</p>
<p><a href="${esc(humanUrl)}" style="color:#C5391C;">Clique aqui se n\u00e3o for redirecionado</a></p>
</body>
</html>`;
}

export default async function handler(request){
  // Defaults — guarantee we always return valid HTML, never crash
  let origin = "https://podcast-studio-lac.vercel.app";
  let date = "";

  try {
    const u = new URL(request.url);
    origin = u.origin;
    // Honor the public host if Vercel forwarded it (internal origin can differ)
    const fwdHost = request.headers && request.headers.get && request.headers.get("x-forwarded-host");
    const fwdProto = (request.headers && request.headers.get && request.headers.get("x-forwarded-proto")) || "https";
    if(fwdHost) origin = `${fwdProto.split(",")[0]}://${fwdHost.split(",")[0]}`;
    date = (u.searchParams.get("date") || "").trim();
  } catch(e){ /* keep defaults */ }

  const humanUrl = date
    ? `${origin}/?view=public&date=${encodeURIComponent(date)}`
    : `${origin}/`;

  let title = `${SITE_NAME} \u00b7 Atualiza\u00e7\u00f5es de IA para quem tem pouco tempo`;
  let description = DEFAULT_DESC;
  let image = origin + DEFAULT_IMAGE_PATH;

  try {
    if(date && SUPABASE_URL && SUPABASE_ANON_KEY && typeof fetch === "function"){
      const id = `newsletter:${date}`;
      const q = `${SUPABASE_URL}/rest/v1/newsletters?id=eq.${encodeURIComponent(id)}&select=data`;
      const r = await fetch(q, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if(r.ok){
        const rows = await r.json();
        const nl = Array.isArray(rows) && rows[0] && rows[0].data ? rows[0].data : null;
        if(nl){
          title = `${nl.title || "Edi\u00e7\u00e3o"} \u00b7 ${SITE_NAME}`;
          const summary = String(nl.aiSummary || nl.subtitle || DEFAULT_DESC).replace(/\s+/g, " ").trim();
          description = summary.length > 200 ? summary.slice(0, 197) + "\u2026" : summary;
          if(nl.infographicUrl) image = nl.infographicUrl;
        }
      }
    }
  } catch(e){ /* fall through to defaults */ }

  let html;
  try { html = buildHtml({ title, description, image, humanUrl, date }); }
  catch(e){ html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${humanUrl}"></head><body>Redirecionando\u2026</body></html>`; }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
