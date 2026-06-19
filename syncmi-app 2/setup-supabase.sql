-- ═══════════════════════════════════════════════════════════════════════════
-- SYNC·MI · SUPABASE SETUP (v13 — editorial design)
-- Cole isto inteiro no SQL Editor do Supabase e rode (▶ Run)
-- É idempotente — pode rodar várias vezes sem problemas
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Tabelas (todas com mesma estrutura: id text PK, data jsonb)
create table if not exists public.newsletters (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.comments (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.views (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.episodes (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.settings (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.videoblobs (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.audioblobs (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.news_sources (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.podcasts (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.podviews (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.subscribers (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.opens (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.email_logs (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
create table if not exists public.learnings (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);

-- 2) RLS em todas
alter table public.newsletters   enable row level security;
alter table public.comments      enable row level security;
alter table public.views         enable row level security;
alter table public.episodes      enable row level security;
alter table public.settings      enable row level security;
alter table public.videoblobs    enable row level security;
alter table public.audioblobs    enable row level security;
alter table public.news_sources  enable row level security;
alter table public.podcasts      enable row level security;
alter table public.podviews      enable row level security;
alter table public.subscribers   enable row level security;
alter table public.opens         enable row level security;
alter table public.email_logs    enable row level security;
alter table public.learnings     enable row level security;

-- 3) Policies (público lê, admin autenticado escreve)
drop policy if exists "nl_public_read" on public.newsletters;
create policy "nl_public_read" on public.newsletters for select to anon, authenticated using (true);
drop policy if exists "nl_admin_write" on public.newsletters;
create policy "nl_admin_write" on public.newsletters for all to authenticated using (true) with check (true);

drop policy if exists "cm_public_read" on public.comments;
create policy "cm_public_read" on public.comments for select to anon, authenticated using (true);
drop policy if exists "cm_public_insert" on public.comments;
create policy "cm_public_insert" on public.comments for insert to anon, authenticated with check (true);
drop policy if exists "cm_admin_update" on public.comments;
create policy "cm_admin_update" on public.comments for update to authenticated using (true) with check (true);
drop policy if exists "cm_admin_delete" on public.comments;
create policy "cm_admin_delete" on public.comments for delete to authenticated using (true);

drop policy if exists "vw_public_insert" on public.views;
create policy "vw_public_insert" on public.views for insert to anon, authenticated with check (true);
drop policy if exists "vw_admin_read" on public.views;
create policy "vw_admin_read" on public.views for select to authenticated using (true);

drop policy if exists "ep_admin_all" on public.episodes;
create policy "ep_admin_all" on public.episodes for all to authenticated using (true) with check (true);

drop policy if exists "st_admin_all" on public.settings;
create policy "st_admin_all" on public.settings for all to authenticated using (true) with check (true);

drop policy if exists "vb_public_read" on public.videoblobs;
create policy "vb_public_read" on public.videoblobs for select to anon, authenticated using (true);
drop policy if exists "vb_admin_write" on public.videoblobs;
create policy "vb_admin_write" on public.videoblobs for all to authenticated using (true) with check (true);

drop policy if exists "ab_public_read" on public.audioblobs;
create policy "ab_public_read" on public.audioblobs for select to anon, authenticated using (true);
drop policy if exists "ab_admin_write" on public.audioblobs;
create policy "ab_admin_write" on public.audioblobs for all to authenticated using (true) with check (true);

drop policy if exists "ns_public_read" on public.news_sources;
create policy "ns_public_read" on public.news_sources for select to anon, authenticated using (true);
drop policy if exists "ns_admin_write" on public.news_sources;
create policy "ns_admin_write" on public.news_sources for all to authenticated using (true) with check (true);

-- PODCASTS (público lê, admin escreve)
drop policy if exists "pd_public_read" on public.podcasts;
create policy "pd_public_read" on public.podcasts for select to anon, authenticated using (true);
drop policy if exists "pd_admin_write" on public.podcasts;
create policy "pd_admin_write" on public.podcasts for all to authenticated using (true) with check (true);

-- LEARNINGS (público lê, admin escreve)
drop policy if exists "ln_public_read" on public.learnings;
create policy "ln_public_read" on public.learnings for select to anon, authenticated using (true);
drop policy if exists "ln_admin_write" on public.learnings;
create policy "ln_admin_write" on public.learnings for all to authenticated using (true) with check (true);

-- PODVIEWS (anon insere; admin lê)
drop policy if exists "pv_public_insert" on public.podviews;
create policy "pv_public_insert" on public.podviews for insert to anon, authenticated with check (true);
drop policy if exists "pv_admin_read" on public.podviews;
create policy "pv_admin_read" on public.podviews for select to authenticated using (true);

-- SUBSCRIBERS (anon insere/atualiza = inscrição idempotente; só admin LÊ os emails)
-- Obs: a leitura é restrita ao admin para não expor a lista de emails publicamente.
-- A função serverless /api/send-episode usa a service_role key (bypassa RLS) para ler.
drop policy if exists "sub_public_insert" on public.subscribers;
create policy "sub_public_insert" on public.subscribers for insert to anon, authenticated with check (true);
drop policy if exists "sub_public_update" on public.subscribers;
create policy "sub_public_update" on public.subscribers for update to anon, authenticated using (true) with check (true);
drop policy if exists "sub_admin_read" on public.subscribers;
create policy "sub_admin_read" on public.subscribers for select to authenticated using (true);
drop policy if exists "sub_admin_delete" on public.subscribers;
create policy "sub_admin_delete" on public.subscribers for delete to authenticated using (true);

-- OPENS (anon insere/atualiza = registro de abertura idempotente; admin lê)
drop policy if exists "op_public_insert" on public.opens;
create policy "op_public_insert" on public.opens for insert to anon, authenticated with check (true);
drop policy if exists "op_public_update" on public.opens;
create policy "op_public_update" on public.opens for update to anon, authenticated using (true) with check (true);
drop policy if exists "op_admin_read" on public.opens;
create policy "op_admin_read" on public.opens for select to authenticated using (true);

-- EMAIL_LOGS (somente admin lê; gravação feita pela service_role na função serverless)
drop policy if exists "el_admin_read" on public.email_logs;
create policy "el_admin_read" on public.email_logs for select to authenticated using (true);

-- 4) Trigger para updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare t text;
begin
  for t in select unnest(array['newsletters','comments','views','episodes','settings','videoblobs','audioblobs','news_sources','podcasts','podviews','subscribers','opens','email_logs','learnings']) loop
    execute format('drop trigger if exists touch_%s on public.%I', t, t);
    execute format('create trigger touch_%s before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- 5) Crie o usuário admin em Authentication → Users → Add User
-- Email: emigotto@syncronize-mi.local
-- Password: Migotto1
-- Marque "Auto Confirm Email"

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) SUPABASE STORAGE — bucket para áudios e vídeos grandes
-- (alternativa ao base64 no JSONB; suporta até 250MB por arquivo)
-- ═══════════════════════════════════════════════════════════════════════════

-- 6a) Criar bucket "media" (público para leitura, 300MB por arquivo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  314572800,  -- 300MB em bytes (buffer acima dos 250MB de limite na UI)
  array['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm','audio/aac','audio/m4a','audio/x-m4a','audio/mp4','audio/flac','video/mp4','video/webm','video/quicktime','video/x-msvideo','video/x-matroska','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 314572800,
  allowed_mime_types = excluded.allowed_mime_types;

-- 6b) Policies de Storage (público lê; só admin autenticado escreve/edita/apaga)
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media');

-- ═══════════════════════════════════════════════════════════════════════════
-- HEALTHCHECK STATE — single row tracking site up/down for the email monitor
-- (written only by the serverless function using the service_role key)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.health_state (
  id           text primary key,
  status       text,
  changed_at   timestamptz,
  last_alert_at timestamptz
);
alter table public.health_state enable row level security;
-- No public policies: only the service_role key (server-side) can read/write it.
