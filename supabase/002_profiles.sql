-- YourMovie: профілі користувачів (нікнейм, ПІБ, телефон, країна).
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

create sequence if not exists public.profiles_user_number_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_number bigint not null unique default nextval('public.profiles_user_number_seq'),
  -- 3–24 символи: латиниця, кирилиця, цифри, _ . -
  nickname text not null check (nickname ~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$'),
  full_name text check (char_length(full_name) <= 100),
  phone text check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  country text check (country ~ '^[A-Z]{2}$'),          -- код країни: UA, PL…
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Нікнейм унікальний без урахування регістру (Kapton = kapton).
create unique index if not exists profiles_nickname_unique on public.profiles (lower(nickname));

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Профіль створюється сам під час реєстрації. Нік — з форми реєстрації,
-- а якщо його немає або він уже зайнятий — «User» + номер користувача.
create or replace function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n bigint := nextval('public.profiles_user_number_seq');
  wanted text := new.raw_user_meta_data ->> 'nickname';
begin
  if wanted is null or wanted !~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$'
     or exists (select 1 from public.profiles p where lower(p.nickname) = lower(wanted)) then
    wanted := 'User' || n;
  end if;
  insert into public.profiles (id, user_number, nickname) values (new.id, n, wanted);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.create_profile_for_user();

-- Тим, хто зареєструвався раніше, — профіль з ніком User + номер.
do $$
declare
  u record;
  n bigint;
begin
  for u in select id from auth.users where id not in (select id from public.profiles) order by created_at loop
    n := nextval('public.profiles_user_number_seq');
    insert into public.profiles (id, user_number, nickname) values (u.id, n, 'User' || n);
  end loop;
end;
$$;

-- Чи вільний нікнейм (для підказки під час реєстрації; доступно всім).
create or replace function public.nickname_available(nick text) returns boolean
language sql stable security definer set search_path = '' as $$
  select nick ~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$'
     and not exists (select 1 from public.profiles p where lower(p.nickname) = lower(nick));
$$;

-- Захист: свій профіль бачить і змінює лише власник; номер і id змінити не можна.
alter table public.profiles enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nickname, full_name, phone, country) on public.profiles to authenticated;

revoke all on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to anon, authenticated;
revoke all on function public.create_profile_for_user() from public, anon, authenticated;
