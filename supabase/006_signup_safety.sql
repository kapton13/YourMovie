-- YourMovie: реєстрація не падає, якщо нікнейм щойно зайняли; ніки «User123» — лише автоматичні.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

-- Профіль під час реєстрації. Якщо двоє одночасно беруть той самий нік (або «User»+номер уже
-- хтось узяв вручну) — не ламаємо реєстрацію, а даємо запасний нік.
create or replace function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n bigint := nextval('public.profiles_user_number_seq');
  wanted text := new.raw_user_meta_data ->> 'nickname';
begin
  if wanted is null or wanted !~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$'
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

-- «User» + цифри — зарезервовано для автоматичних ніків: вибрати такий самому не можна.
create or replace function public.nickname_available(nick text) returns boolean
language sql stable security definer set search_path = '' as $$
  select nick ~ '^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$'
     and nick !~* '^user[0-9]+$'
     and not exists (select 1 from public.profiles p where lower(p.nickname) = lower(nick));
$$;

revoke all on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to anon, authenticated;
revoke all on function public.create_profile_for_user() from public, anon, authenticated;
