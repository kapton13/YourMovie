-- YourMovie: нікнейми будь-якою мовою, але літери лише однієї абетки (щоб «Аdmin» з кириличною «А»
-- не видавав себе за «Admin»). 3–24 символи; також цифри та _ . -
-- Ті самі діапазони — у lib/profile.ts (NICKNAME_SCRIPTS); змінювати разом.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

create or replace function public.nickname_valid(nick text) returns boolean
language sql immutable set search_path = '' as $$
  select nick is not null
    and char_length(nick) between 3 and 24
    and (
         nick ~ '^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u1E00-\u1EFF\u0300-\u036F0-9_.-]+$'  -- латиниця
      or nick ~ '^[\u0400-\u052F\u0300-\u036F0-9_.-]+$'  -- кирилиця
      or nick ~ '^[\u0370-\u03FF\u1F00-\u1FFF\u0300-\u036F0-9_.-]+$'  -- грецька
      or nick ~ '^[\u0531-\u058F0-9_.-]+$'  -- вірменська
      or nick ~ '^[\u10A0-\u10FF\u1C90-\u1CBF0-9_.-]+$'  -- грузинська
      or nick ~ '^[\u0590-\u05FF0-9_.-]+$'  -- іврит
      or nick ~ '^[\u0600-\u06FF\u0750-\u077F\u200C0-9_.-]+$'  -- арабська
      or nick ~ '^[\u0900-\u097F\u200C\u200D0-9_.-]+$'  -- деванагарі
      or nick ~ '^[\u0980-\u09FF\u200C\u200D0-9_.-]+$'  -- бенгальська
      or nick ~ '^[\u0A00-\u0A7F\u200C\u200D0-9_.-]+$'  -- гурмукхі
      or nick ~ '^[\u0A80-\u0AFF\u200C\u200D0-9_.-]+$'  -- гуджараті
      or nick ~ '^[\u0B80-\u0BFF\u200C\u200D0-9_.-]+$'  -- тамільська
      or nick ~ '^[\u0C00-\u0C7F\u200C\u200D0-9_.-]+$'  -- телугу
      or nick ~ '^[\u0C80-\u0CFF\u200C\u200D0-9_.-]+$'  -- каннада
      or nick ~ '^[\u0D00-\u0D7F\u200C\u200D0-9_.-]+$'  -- малаялам
      or nick ~ '^[\u0E00-\u0E7F0-9_.-]+$'  -- тайська
      or nick ~ '^[\u0E80-\u0EFF0-9_.-]+$'  -- лаоська
      or nick ~ '^[\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF0-9_.-]+$'  -- японська / китайська
      or nick ~ '^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF0-9_.-]+$'  -- корейська
    );
$$;

-- Старе правило (латиниця/кирилиця) лишається дозволеним для вже існуючих ніків; нові й змінені
-- перевіряє тригер нижче.
do $$
declare
  c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%nickname%'
  loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
end;
$$;

alter table public.profiles add constraint profiles_nickname_valid
  check (public.nickname_valid(nickname) or nickname ~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$');

create or replace function public.check_new_nickname() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' or new.nickname is distinct from old.nickname) and not public.nickname_valid(new.nickname) then
    raise exception 'nickname is not valid' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_nickname_check on public.profiles;
create trigger profiles_nickname_check before insert or update of nickname on public.profiles
  for each row execute function public.check_new_nickname();

-- Профіль під час реєстрації: нік з форми, якщо він правильний і вільний, інакше — «User» + номер.
create or replace function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n bigint := nextval('public.profiles_user_number_seq');
  wanted text := normalize(new.raw_user_meta_data ->> 'nickname', NFC);
begin
  if wanted is null or not public.nickname_valid(wanted)
     or wanted ~* '^user[0-9]+$'
     or exists (select 1 from public.profiles p where lower(p.nickname) = lower(wanted)) then
    wanted := 'User' || n;
  end if;
  begin
    insert into public.profiles (id, user_number, nickname) values (new.id, n, wanted);
  exception when unique_violation then
    insert into public.profiles (id, user_number, nickname)
    values (new.id, n, 'User' || n || '_' || substr(md5(new.id::text), 1, 4));
  end;
  return new;
end;
$$;

create or replace function public.nickname_available(nick text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.nickname_valid(nick)
     and nick !~* '^user[0-9]+$'
     and not exists (select 1 from public.profiles p where lower(p.nickname) = lower(nick));
$$;

revoke all on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to anon, authenticated;
revoke all on function public.create_profile_for_user() from public, anon, authenticated;
revoke all on function public.check_new_nickname() from public, anon, authenticated;
