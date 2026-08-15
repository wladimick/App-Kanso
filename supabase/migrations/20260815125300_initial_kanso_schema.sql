-- Kanso · esquema inicial de seguimiento personal
-- Fecha: 2026-08-15
-- Seguridad: acceso solo para usuarios autenticados y propietarios de cada fila.

create extension if not exists pgcrypto;

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('tmdb', 'anilist', 'manual')),
  external_id text not null,
  media_type text not null check (media_type in ('movie', 'series', 'anime', 'manga')),
  title text not null,
  original_title text,
  poster_url text,
  release_year integer check (release_year is null or release_year between 1888 and 2200),
  status text not null default 'planned' check (status in ('planned', 'watching', 'completed', 'paused', 'dropped')),
  current_season integer check (current_season is null or current_season >= 0),
  current_episode integer check (current_episode is null or current_episode >= 0),
  total_seasons integer check (total_seasons is null or total_seasons >= 0),
  total_episodes integer check (total_episodes is null or total_episodes >= 0),
  score numeric(3,1) check (score is null or (score >= 0 and score <= 10)),
  favorite boolean not null default false,
  notes text,
  started_at date,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id, media_type),
  unique (id, user_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  unique (id, user_id)
);

create table public.collection_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null,
  library_item_id uuid not null,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  primary key (collection_id, library_item_id),
  foreign key (collection_id, user_id)
    references public.collections(id, user_id) on delete cascade,
  foreign key (library_item_id, user_id)
    references public.library_items(id, user_id) on delete cascade
);

create table public.watch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null,
  event_type text not null check (event_type in ('started', 'progress', 'completed', 'rewatched', 'rated')),
  season integer check (season is null or season >= 0),
  episode integer check (episode is null or episode >= 0),
  score numeric(3,1) check (score is null or (score >= 0 and score <= 10)),
  watched_at timestamptz not null default now(),
  foreign key (library_item_id, user_id)
    references public.library_items(id, user_id) on delete cascade
);

create index library_items_user_status_idx on public.library_items(user_id, status);
create index library_items_user_type_idx on public.library_items(user_id, media_type);
create index library_items_user_updated_idx on public.library_items(user_id, updated_at desc);
create index collections_user_idx on public.collections(user_id);
create index watch_events_item_date_idx on public.watch_events(library_item_id, watched_at desc);
create index watch_events_user_date_idx on public.watch_events(user_id, watched_at desc);

alter table public.library_items enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.watch_events enable row level security;

revoke all on public.library_items from anon;
revoke all on public.collections from anon;
revoke all on public.collection_items from anon;
revoke all on public.watch_events from anon;

grant select, insert, update, delete on public.library_items to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;
grant select, insert, update, delete on public.watch_events to authenticated;

create policy "library_items_select_own"
on public.library_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "library_items_insert_own"
on public.library_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "library_items_update_own"
on public.library_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "library_items_delete_own"
on public.library_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "collections_select_own"
on public.collections for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "collections_insert_own"
on public.collections for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "collections_update_own"
on public.collections for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "collections_delete_own"
on public.collections for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "collection_items_select_own"
on public.collection_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "collection_items_insert_own"
on public.collection_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "collection_items_update_own"
on public.collection_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "collection_items_delete_own"
on public.collection_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "watch_events_select_own"
on public.watch_events for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "watch_events_insert_own"
on public.watch_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "watch_events_update_own"
on public.watch_events for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "watch_events_delete_own"
on public.watch_events for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.library_items is 'Biblioteca personal de películas, series, anime y manga.';
comment on table public.collections is 'Colecciones personalizadas del usuario, por ejemplo Marvel.';
comment on table public.collection_items is 'Relación segura entre colecciones y títulos del mismo usuario.';
comment on table public.watch_events is 'Historial cronológico de progreso, finalizaciones, revisualizaciones y notas.';
