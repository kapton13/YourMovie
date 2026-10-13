-- YourMovie: список «Не цікаво» — аніме, які користувач не хоче бачити.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

create table if not exists public.hidden_media (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_id integer not null,        -- id частини (сезону, фільму…) в AniList
  franchise_key integer not null,   -- id усього аніме (першої частини) — щоб ховати й повертати разом
  created_at timestamptz not null default now(),
  primary key (user_id, media_id)
);

create index if not exists hidden_media_key on public.hidden_media (user_id, franchise_key);

alter table public.hidden_media enable row level security;

drop policy if exists "own hidden media" on public.hidden_media;
create policy "own hidden media" on public.hidden_media
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.hidden_media from anon;
grant select, insert, update, delete on public.hidden_media to authenticated;
