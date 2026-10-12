-- YourMovie: особисті списки, оцінки й відмітки серій.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run.
-- Повторний запуск безпечний (нічого не зламає й не видалить).

-- Аніме в списку користувача: статус і загальна оцінка.
create table if not exists public.list_entries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_id integer not null,                       -- id аніме в AniList
  status text not null check (status in ('watching', 'planning', 'completed', 'paused', 'dropped')),
  score numeric(3, 1) check (score >= 1 and score <= 10),  -- 1–10; дробова — середнє оцінок серій
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id)
);

-- Переглянуті серії та оцінки серій.
create table if not exists public.episode_marks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_id integer not null,
  episode integer not null check (episode > 0),
  watched boolean not null default true,
  score smallint check (score >= 1 and score <= 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id, episode)
);

create index if not exists list_entries_user_status on public.list_entries (user_id, status, updated_at desc);

-- Час останньої зміни оновлюється сам.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists list_entries_touch on public.list_entries;
create trigger list_entries_touch before update on public.list_entries
  for each row execute function public.touch_updated_at();

drop trigger if exists episode_marks_touch on public.episode_marks;
create trigger episode_marks_touch before update on public.episode_marks
  for each row execute function public.touch_updated_at();

-- Захист: кожен бачить і змінює лише свої записи.
alter table public.list_entries enable row level security;
alter table public.episode_marks enable row level security;

drop policy if exists "own list entries" on public.list_entries;
create policy "own list entries" on public.list_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own episode marks" on public.episode_marks;
create policy "own episode marks" on public.episode_marks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.list_entries, public.episode_marks from anon;
grant select, insert, update, delete on public.list_entries, public.episode_marks to authenticated;
