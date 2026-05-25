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
// Returning it here is equivalent to hardcoding it in index.html, except now it
// lives only in Vercel env vars (not committed to the repo).
//
// SETUP: in Vercel → Project → Settings → Environment Variables, set (Production):
//   SUPABASE_URL       = https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  = eyJ...
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(){
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  return new Response(JSON.stringify({ supabaseUrl, supabaseAnonKey }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Cache at the edge for 5 min; safe because the values rarely change
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
