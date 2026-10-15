-- YourMovie: мова сайту в профілі — щоб обрана мова діяла на всіх пристроях.
-- Запуск: Supabase → SQL Editor → New query → вставити весь текст → Run. Повторний запуск безпечний.

alter table public.profiles add column if not exists language text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_language_code') then
    alter table public.profiles add constraint profiles_language_code
      check (language is null or language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$');
  end if;
end;
$$;

grant update (language) on public.profiles to authenticated;
