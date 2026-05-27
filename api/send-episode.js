// ═══════════════════════════════════════════════════════════════════════════
// Sync·MI — Send a published episode by email to all active subscribers
//
// Triggered from the admin (Step 6 → "Enviar episódio aos inscritos"):
//   POST /api/send-episode?date=2026-05-19
//
// For each subscriber it builds a UNIQUE tracking link:
//   {origin}/?view=public&date=DATE&ec=EPISODE_CODE&ref=SUBSCRIBER_REF
// When that subscriber opens the page, the app records an "open" → Audiência.
//
// REQUIRED env vars in Vercel (Production):
//   SUPABASE_URL                 = https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    = eyJ...  (SECRET — Settings → API → service_role;
//                                  bypasses RLS to read subscribers + write logs.
//                                  NEVER expose this to the browser / /api/config.)
//   RESEND_API_KEY               = re_...  (resend.com → API Keys)
//   EMAIL_FROM                   = "Sync·MI <ola@seu-dominio.com>"  (domain verified in Resend)
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Sync·MI <onboarding@resend.dev>";

function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function emailHtml({ title, subtitle, summary, infographicUrl, episodeUrl }){
  const cover = `
    <tr><td style="padding:0 0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#14110D;border-radius:14px;">
        <tr><td style="padding:36px 32px;">
          <div style="font-family:'JetBrains Mono',monospace,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#D4A52E;margin-bottom:14px;">▲ Novo Episódio</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;color:#F1E9D6;font-weight:normal;">${esc(title)}</div>
          ${subtitle ? `<div style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#C9BEA1;margin-top:14px;">${esc(subtitle)}</div>` : ""}
        </td></tr>
      </table>
    </td></tr>`;
  const infographic = infographicUrl ? `
    <tr><td style="padding:0 0 24px;">
      <a href="${esc(episodeUrl)}" style="text-decoration:none;">
        <img src="${esc(infographicUrl)}" alt="Infográfico do episódio" width="536" style="width:100%;max-width:536px;display:block;border-radius:12px;border:1px solid #C9BEA1;"/>
      </a>
    </td></tr>` : "";
  const summaryBlock = summary ? `
    <tr><td style="padding:0 0 28px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2A241B;">
      ${esc(summary)}
    </td></tr>` : "";
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#E8DFC8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E8DFC8;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#F1E9D6;border-radius:18px;padding:32px;border:1px solid #C9BEA1;">
    <tr><td style="padding:0 0 24px;border-bottom:1px solid #C9BEA1;">
      <span style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#14110D;">Sync<span style="color:#C5391C;">·MI</span></span>
      <span style="font-family:'JetBrains Mono',monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7A6F5A;float:right;padding-top:6px;">Atualizações de IA</span>
    </td></tr>
    <tr><td style="height:24px;"></td></tr>
    ${cover}
    ${infographic}
    ${summaryBlock}
    <tr><td align="center" style="padding:0 0 28px;">
      <a href="${esc(episodeUrl)}" style="display:inline-block;background:#14110D;color:#F1E9D6;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;padding:15px 34px;border-radius:100px;">Ler o episódio em 5 min →</a>
    </td></tr>
    <tr><td style="padding:20px 0 0;border-top:1px solid #C9BEA1;font-family:'JetBrains Mono',monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#7A6F5A;text-align:center;">
      Sync·MI · Leia em 5 min, assista em 5 min<br/>
      <span style="color:#A89B80;">Você recebe este email porque se inscreveu na newsletter.</span>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

async function sbFetch(path, opts){
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(opts && opts.headers ? opts.headers : {}),
    },
  });
}

export default async function handler(req, res){
  const send = (code, obj) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
  };

  try {
    // Parse date
    let date = "";
    let origin = "https://podcast-studio-lac.vercel.app";
    try {
      const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
      const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
      if(host) origin = `${proto}://${host}`;
      const u = new URL(req.url, origin);
      date = (u.searchParams.get("date") || "").trim();
    } catch(e){}

    if(!date) return send(400, { ok:false, error:"Parâmetro 'date' ausente." });
    if(!SUPABASE_URL || !SERVICE_KEY) return send(500, { ok:false, error:"Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no Vercel." });
    if(!RESEND_API_KEY) return send(500, { ok:false, error:"Falta RESEND_API_KEY no Vercel (crie em resend.com)." });

    // 1) Read the newsletter
    const nlRes = await sbFetch(`newsletters?id=eq.${encodeURIComponent("newsletter:"+date)}&select=data`, { method:"GET" });
    if(!nlRes.ok) return send(502, { ok:false, error:"Falha ao ler a edição do Supabase." });
    const nlRows = await nlRes.json();
    const nl = Array.isArray(nlRows) && nlRows[0] && nlRows[0].data ? nlRows[0].data : null;
    if(!nl) return send(404, { ok:false, error:"Edição não encontrada. Publique antes de enviar." });

    const subject = (nl.emailSubject && nl.emailSubject.trim()) || nl.title || `Sync·MI · ${date}`;
    const episodeCode = nl.episodeCode || "";
    const summary = String(nl.aiSummary || nl.subtitle || "").replace(/\s+/g," ").trim().slice(0, 420);

    // 2) Read all active subscribers
    const subRes = await sbFetch(`subscribers?select=data&limit=5000`, { method:"GET" });
    if(!subRes.ok) return send(502, { ok:false, error:"Falha ao ler inscritos." });
    const subRows = await subRes.json();
    const subs = (Array.isArray(subRows)?subRows:[]).map(r=>r.data).filter(s=>s && s.email && s.active!==false);
    if(subs.length===0) return send(200, { ok:true, sent:0, failed:0, note:"Nenhum inscrito ativo." });

    // 3) Build personalized messages
    const messages = subs.map(s=>{
      const ref = s.ref || (s.id||"").replace("subscriber:","");
      const episodeUrl = `${origin}/?view=public&date=${encodeURIComponent(date)}${episodeCode?`&ec=${encodeURIComponent(episodeCode)}`:""}&ref=${encodeURIComponent(ref)}`;
      return {
        from: EMAIL_FROM,
        to: [s.email],
        subject,
        html: emailHtml({ title: nl.title||subject, subtitle: nl.subtitle||"", summary, infographicUrl: nl.infographicUrl||"", episodeUrl }),
      };
    });

    // 4) Send via Resend batch endpoint (max 100 per call)
    let sent = 0, failed = 0;
    for(let i=0;i<messages.length;i+=100){
      const chunk = messages.slice(i, i+100);
      try {
        const r = await fetch("https://api.resend.com/emails/batch", {
          method:"POST",
          headers:{ Authorization:`Bearer ${RESEND_API_KEY}`, "Content-Type":"application/json" },
          body: JSON.stringify(chunk),
        });
        if(r.ok){ sent += chunk.length; }
        else { failed += chunk.length; }
      } catch(e){ failed += chunk.length; }
    }

    // 5) Log sends + bump emailsSent (best effort; don't fail the whole request on errors)
    const now = Date.now();
    await Promise.all(subs.map(async s=>{
      try {
        const ref = s.ref || (s.id||"").replace("subscriber:","");
        const logId = `emaillog:${date}:${ref}`;
        await sbFetch(`email_logs`, {
          method:"POST",
          headers:{ Prefer:"resolution=merge-duplicates" },
          body: JSON.stringify({ id:logId, data:{ id:logId, episodeDate:date, subscriberId:s.id, email:s.email, sentAt:now } }),
        });
        const newData = { ...s, emailsSent:(s.emailsSent||0)+1, lastEmailAt:now };
        await sbFetch(`subscribers?id=eq.${encodeURIComponent(s.id)}`, {
          method:"PATCH",
          body: JSON.stringify({ data:newData }),
        });
      } catch(e){}
    }));

    return send(200, { ok:true, sent, failed });
  } catch(err){
    return send(500, { ok:false, error: String(err && err.message ? err.message : err) });
  }
}
