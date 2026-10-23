-- YourMovie: копія даних про аніме з AniList (lib/animeStore.ts) — щоб сторінки працювали швидше
-- й не падали, коли AniList недоступний. Дані публічні (ті самі, що показує сайт), тож читати можуть усі;
-- записують лише сервер сайту й нічний робот — секретним ключем, який обходить RLS (політик на запис немає).
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

create table if not exists public.anime_store (
  kind text not null check (kind in ('franchise', 'part', 'media', 'details', 'episodes')),
  id integer not null,               -- id в AniList (для 'franchise' — id першої частини аніме)
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
-- kind: 'franchise' — усі частини аніме; 'part' — до якого аніме належить частина ({"key": …});
-- 'media' — картка для «Моїх аніме» й профілю; 'details' — сторінка аніме; 'episodes' — серії.

-- Нічний робот спершу оновлює найстаріше.
create index if not exists anime_store_updated on public.anime_store (kind, updated_at);

alter table public.anime_store enable row level security;

drop policy if exists "anime store is public" on public.anime_store;
create policy "anime store is public" on public.anime_store
  for select to anon, authenticated
  using (true);

revoke all on public.anime_store from anon, authenticated;
grant select on public.anime_store to anon, authenticated;
