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
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "";        // e.g. "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const SITE_NAME = "Sync·MI";
const DEFAULT_IMAGE_PATH = "/og-default.png"; // a 1200x630 fallback image at project root
const DEFAULT_DESC = "Newsletter e podcast semanais de IA — curados, sucintos, sem hype.";

function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtDateLong(iso){
  if(!iso) return "";
  const M = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const [y,m,d] = iso.split("-");
  return `${parseInt(d,10)} de ${M[parseInt(m,10)-1]} de ${y}`;
}

module.exports = async (req, res) => {
  // Parse date param
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const origin = `${proto}://${host}`;
  const url = new URL(req.url, origin);
  const date = (url.searchParams.get("date") || "").trim();

  // Where humans should land (the real SPA page)
  const humanUrl = date
    ? `${origin}/?view=public&date=${encodeURIComponent(date)}`
    : `${origin}/`;

  // Defaults (used if anything fails)
  let title = `${SITE_NAME} · Atualizações de IA para quem tem pouco tempo`;
  let description = DEFAULT_DESC;
  let image = origin + DEFAULT_IMAGE_PATH;

  try {
    if(date && SUPABASE_URL && SUPABASE_ANON_KEY){
      const id = `newsletter:${date}`;
      const q = `${SUPABASE_URL}/rest/v1/newsletters?id=eq.${encodeURIComponent(id)}&select=data`;
      const r = await fetch(q, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if(r.ok){
        const rows = await r.json();
        const nl = Array.isArray(rows) && rows[0] && rows[0].data ? rows[0].data : null;
        if(nl){
          title = `${nl.title || "Edição"} · ${SITE_NAME}`;
          const summary = (nl.aiSummary || nl.subtitle || DEFAULT_DESC).replace(/\s+/g, " ").trim();
          description = summary.length > 200 ? summary.slice(0, 197) + "…" : summary;
          if(nl.infographicUrl) image = nl.infographicUrl;
        }
      }
    }
  } catch(e){
    // fall through to defaults
  }

  const html = `<!DOCTYPE html>
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
<script>window.location.replace(${JSON.stringify(humanUrl)});</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#F1E9D6;color:#14110D;padding:40px;text-align:center;">
<p>Redirecionando para a edição de ${esc(fmtDateLong(date))}…</p>
<p><a href="${esc(humanUrl)}" style="color:#C5391C;">Clique aqui se não for redirecionado</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache at the edge for 5 min, allow stale while revalidating
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
};
