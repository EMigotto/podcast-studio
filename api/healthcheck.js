// ═══════════════════════════════════════════════════════════════════════════
// Sync·MI — Uptime healthcheck with email alerts
//
// Triggered by a Vercel Cron Job (see vercel.json → "crons"):
//   GET /api/healthcheck   every 5 minutes
//
// What it does on each run:
//   1) Fetches the public site (HEALTHCHECK_URL) and, optionally, the Supabase REST API.
//   2) Decides UP / DOWN (a request that times out, errors, or returns >=500 = DOWN).
//   3) Compares with the last known state stored in Supabase (table "health_state").
//   4) Sends an email via Resend ONLY on transitions:
//        - UP  → DOWN : "🔴 Sync·MI fora do ar"
//        - DOWN → UP  : "🟢 Sync·MI voltou ao ar"
//      (plus an optional reminder every REMIND_HOURS while still down).
//
// REQUIRED env vars in Vercel (Production):
//   ALERT_EMAIL_TO               = seu-email@dominio.com   (quem recebe o alerta)
//   RESEND_API_KEY               = re_...                  (resend.com → API Keys)
//   EMAIL_FROM                   = "Sync·MI <ola@seu-dominio.com>"  (domínio verificado no Resend)
//   SUPABASE_URL                 = https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    = eyJ...                  (SECRET — guarda o estado do healthcheck)
// OPTIONAL env vars:
//   HEALTHCHECK_URL              = https://syncmi.app      (o que será monitorado; default abaixo)
//   HEALTHCHECK_TOKEN            = (string aleatória) → proteja chamando /api/healthcheck?key=ESSE_TOKEN
//                                  (também aceita "Authorization: Bearer <token>" do Vercel Cron)
//   REMIND_HOURS                 = 6                       (lembrete enquanto continua fora; 0 = desliga)
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Sync·MI <onboarding@resend.dev>";
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO || "";
const HEALTHCHECK_URL =
  process.env.HEALTHCHECK_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://syncmi.app";
const CRON_SECRET = process.env.CRON_SECRET || "";
const REMIND_HOURS = Number(process.env.REMIND_HOURS || "6");
const STATE_KEY = "site"; // single-row id in health_state

function json(res, status, body){
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
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

// Fetch with a hard timeout so a hung server still counts as DOWN.
async function fetchWithTimeout(url, ms){
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "SyncMI-Healthcheck/1.0" } });
    return { ok: r.status >= 200 && r.status < 500, status: r.status };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "timeout" : (e.message || "fetch error") };
  } finally {
    clearTimeout(t);
  }
}

async function readState(){
  try {
    const r = await sbFetch(`health_state?id=eq.${STATE_KEY}&select=*`, { method: "GET" });
    if(!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}

async function writeState(status, changedAt, lastAlertAt){
  // upsert via Supabase REST (Prefer: resolution=merge-duplicates)
  try {
    await sbFetch(`health_state?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ id: STATE_KEY, status, changed_at: changedAt, last_alert_at: lastAlertAt }]),
    });
  } catch { /* state is best-effort */ }
}

async function sendEmail(subject, html){
  if(!RESEND_API_KEY || !ALERT_EMAIL_TO) return { sent: false, reason: "missing RESEND_API_KEY or ALERT_EMAIL_TO" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to: [ALERT_EMAIL_TO], subject, html }),
  });
  const ok = r.ok;
  let detail = null; try { detail = await r.json(); } catch {}
  return { sent: ok, detail };
}

function alertHtml({ up, target, status, error, when }){
  const color = up ? "#1B7A3D" : "#C5391C";
  const dot = up ? "🟢" : "🔴";
  const head = up ? "Sync·MI voltou ao ar" : "Sync·MI está fora do ar";
  const detail = up
    ? `O healthcheck conseguiu acessar o site novamente.`
    : `O healthcheck não conseguiu acessar o site${error ? ` (motivo: ${error})` : status ? ` (HTTP ${status})` : ""}.`;
  return `<!DOCTYPE html><html><body style="margin:0;background:#E8DFC8;padding:32px 16px;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#F1E9D6;border-radius:16px;padding:30px;border:1px solid #C9BEA1;">
      <tr><td style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#14110D;padding-bottom:18px;border-bottom:1px solid #C9BEA1;">Sync<span style="color:#C5391C;">·MI</span> · Monitor</td></tr>
      <tr><td style="padding:22px 0 8px;font-family:Georgia,serif;font-size:24px;color:${color};">${dot} ${head}</td></tr>
      <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2A241B;padding-bottom:14px;">${detail}</td></tr>
      <tr><td style="font-family:'Courier New',monospace;font-size:13px;color:#5A5040;padding:12px 14px;background:#E8DFC8;border-radius:8px;">
        Alvo: <a href="${target}" style="color:#C5391C;">${target}</a><br/>
        Status: ${up ? "UP" : "DOWN"}${status ? ` · HTTP ${status}` : ""}<br/>
        Quando: ${when}
      </td></tr>
      ${up ? "" : `<tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#7A6F5A;padding-top:16px;">O que checar: deploy no Vercel, variáveis de ambiente, e o status do Supabase.</td></tr>`}
    </table>
  </td></tr></table></body></html>`;
}

export default async function handler(req, res){
  // Auth: accept the secret via query string (?key=...) OR the cron Authorization header.
  // This lets an external pinger (UptimeRobot/cron-job.org) call it with a URL secret,
  // while Vercel Cron (if ever on Pro) still works via the Bearer header.
  const HEALTHCHECK_TOKEN = process.env.HEALTHCHECK_TOKEN || process.env.CRON_SECRET || "";
  if(HEALTHCHECK_TOKEN){
    let qKey = "";
    try { qKey = new URL(req.url, "http://x").searchParams.get("key") || ""; } catch(_){}
    const auth = req.headers["authorization"] || "";
    const headerOk = auth === `Bearer ${HEALTHCHECK_TOKEN}`;
    const queryOk = qKey === HEALTHCHECK_TOKEN;
    if(!headerOk && !queryOk) return json(res, 401, { ok:false, error:"unauthorized (forneça ?key=SEU_TOKEN)" });
  }
  if(!SUPABASE_URL || !SERVICE_KEY){
    return json(res, 200, { ok:false, error:"healthcheck precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel" });
  }

  const nowISO = new Date().toISOString();
  const whenStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // 1) Probe the site
  const probe = await fetchWithTimeout(HEALTHCHECK_URL, 12000);
  const up = probe.ok;

  // 2) Read previous state
  const prev = await readState();
  const prevStatus = prev ? prev.status : "unknown";
  const prevAlertAt = prev && prev.last_alert_at ? new Date(prev.last_alert_at).getTime() : 0;

  let emailed = null;
  let newAlertAt = prevAlertAt ? new Date(prevAlertAt).toISOString() : null;

  if(!up){
    const transitioned = prevStatus !== "down";
    const remindDue = REMIND_HOURS > 0 && prevAlertAt && (Date.now() - prevAlertAt) >= REMIND_HOURS*3600*1000;
    if(transitioned || remindDue){
      emailed = await sendEmail("🔴 Sync·MI fora do ar", alertHtml({ up:false, target:HEALTHCHECK_URL, status:probe.status, error:probe.error, when:whenStr }));
      newAlertAt = nowISO;
    }
    await writeState("down", transitioned ? nowISO : (prev && prev.changed_at) || nowISO, newAlertAt);
  } else {
    if(prevStatus === "down"){
      emailed = await sendEmail("🟢 Sync·MI voltou ao ar", alertHtml({ up:true, target:HEALTHCHECK_URL, status:probe.status, when:whenStr }));
    }
    await writeState("up", prevStatus !== "up" ? nowISO : (prev && prev.changed_at) || nowISO, null);
  }

  return json(res, 200, {
    ok: true,
    target: HEALTHCHECK_URL,
    status: up ? "up" : "down",
    httpStatus: probe.status,
    error: probe.error || null,
    previous: prevStatus,
    emailed: emailed ? (emailed.sent ? "sent" : emailed.reason || "failed") : "no-change",
    checkedAt: nowISO,
  });
}
