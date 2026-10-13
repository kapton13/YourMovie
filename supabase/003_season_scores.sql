-- YourMovie: оцінки окремих сезонів (частин) аніме.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

create table if not exists public.season_scores (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_id integer not null,                               -- id сезону (частини) в AniList
  score numeric(3, 1) not null check (score >= 1 and score <= 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id)
);

drop trigger if exists season_scores_touch on public.season_scores;
create trigger season_scores_touch before update on public.season_scores
  for each row execute function public.touch_updated_at();

alter table public.season_scores enable row level security;

drop policy if exists "own season scores" on public.season_scores;
create policy "own season scores" on public.season_scores
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.season_scores from anon;
grant select, insert, update, delete on public.season_scores to authenticated;
