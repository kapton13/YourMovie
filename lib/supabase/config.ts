/**
 * Адреса проєкту Supabase і публічний (publishable) ключ.
 * Вони не секретні: однаково потрапляють у браузер кожного відвідувача,
 * а дані захищають правила доступу (RLS) у самій базі.
 * Секретний ключ (service_role) у коді не зберігаємо ніколи.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mkucgntjelhopgztlusy.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_t1SBwqDTvAEvHz_K-tWEtw_oqXCemfx";
