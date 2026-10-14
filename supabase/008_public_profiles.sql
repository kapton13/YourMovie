-- YourMovie: відкриті профілі. Профіль закритий за замовчуванням; людина може відкрити його в налаштуваннях.
-- Відкритий профіль: усі (і без входу) бачать нікнейм, дату реєстрації, списки, оцінки й відмітки серій.
-- Ніколи не видно: пошта, ПІБ, телефон, країна, «Не цікаво».
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

alter table public.profiles add column if not exists is_public boolean not null default false;
grant update (is_public) on public.profiles to authenticated;

-- Чи відкритий профіль (для правил доступу; читає profiles в обхід «лише свій профіль»).
create or replace function public.is_public_profile(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_public from public.profiles p where p.id = uid), false);
$$;

-- Профіль за нікнеймом — лише публічні поля. id видно, тільки якщо профіль відкритий або свій.
create or replace function public.profile_by_nickname(nick text)
returns table (id uuid, nickname text, user_number bigint, created_at timestamptz, is_public boolean)
language sql stable security definer set search_path = '' as $$
  select case when p.is_public or p.id = (select auth.uid()) then p.id end,
         p.nickname, p.user_number, p.created_at, p.is_public
  from public.profiles p
  where lower(p.nickname) = lower(nick)
  limit 1;
$$;

-- Списки, відмітки серій і оцінки сезонів відкритих профілів можна читати всім.
drop policy if exists "public list entries" on public.list_entries;
create policy "public list entries" on public.list_entries
  for select to anon, authenticated using (public.is_public_profile(user_id));

drop policy if exists "public episode marks" on public.episode_marks;
create policy "public episode marks" on public.episode_marks
  for select to anon, authenticated using (public.is_public_profile(user_id));

drop policy if exists "public season scores" on public.season_scores;
create policy "public season scores" on public.season_scores
  for select to anon, authenticated using (public.is_public_profile(user_id));

grant select on public.list_entries, public.episode_marks, public.season_scores to anon;

revoke all on function public.is_public_profile(uuid) from public;
grant execute on function public.is_public_profile(uuid) to anon, authenticated;
revoke all on function public.profile_by_nickname(text) from public;
grant execute on function public.profile_by_nickname(text) to anon, authenticated;
