// ═══════════════════════════════════════════════════════════════════════════
// Sync·MI — Public runtime config endpoint
//
// WHY: index.html is a static file (no build step), so it can't read Vercel
// environment variables directly — the browser has no process.env. This tiny
// function reads the env vars on the SERVER and returns them as JSON, which the
// app fetches at boot (see the bootstrap() at the bottom of index.html).
//
// SAFE TO EXPOSE: the Supabase anon key is PUBLIC by design — it's meant to ship
// in client code and is protected by Row Level Security (RLS), not by secrecy.
//
// SETUP: in Vercel → Project → Settings → Environment Variables, set (Production):
//   SUPABASE_URL       = https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  = eyJ...
// After adding/changing env vars you MUST redeploy for functions to see them.
//
// NOTE: uses the classic Node.js (req, res) handler with NATIVE response methods
// (res.statusCode / res.setHeader / res.end) — these always exist and actually
// send the response. (Returning a Response object from a default-export function
// does NOT work in Vercel's Node runtime; the value is ignored.)
// ═══════════════════════════════════════════════════════════════════════════

export default function handler(req, res){
  try {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.end(JSON.stringify({ supabaseUrl, supabaseAnonKey }));
  } catch(e){
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ supabaseUrl: "", supabaseAnonKey: "" }));
  }
}
