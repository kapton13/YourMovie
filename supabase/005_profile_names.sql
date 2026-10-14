-- YourMovie: ПІБ у профілі — три окремі поля (прізвище, ім'я, по батькові), кожне до 50 символів.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

alter table public.profiles
  add column if not exists last_name text,
  add column if not exists first_name text,
  add column if not exists middle_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_last_name_length') then
    alter table public.profiles add constraint profiles_last_name_length check (char_length(last_name) <= 50);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_first_name_length') then
    alter table public.profiles add constraint profiles_first_name_length check (char_length(first_name) <= 50);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_middle_name_length') then
    alter table public.profiles add constraint profiles_middle_name_length check (char_length(middle_name) <= 50);
  end if;
end;
$$;

-- Те, що вже записано одним рядком, ділимо: перше слово — прізвище, друге — ім'я, решта — по батькові.
with parts as (
  select id, regexp_split_to_array(regexp_replace(trim(full_name), '\s+', ' ', 'g'), ' ') as w
  from public.profiles
  where full_name is not null and trim(full_name) <> ''
    and last_name is null and first_name is null and middle_name is null
)
update public.profiles p set
  last_name = left(nullif(parts.w[1], ''), 50),
  first_name = left(parts.w[2], 50),
  middle_name = left(nullif(array_to_string(parts.w[3:], ' '), ''), 50),
  full_name = null
from parts
where p.id = parts.id;

-- Змінювати можна нові поля; старе спільне поле ПІБ більше не використовується.
revoke update (full_name) on public.profiles from authenticated;
grant update (nickname, last_name, first_name, middle_name, phone, country) on public.profiles to authenticated;
