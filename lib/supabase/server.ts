import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { REMEMBER_COOKIE, applyRemember } from "./remember";

/** Клієнт Supabase для сервера (обробники запитів, серверні дії): читає й оновлює cookies сесії. */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        const sessionOnly = cookieStore.get(REMEMBER_COOKIE)?.value === "1";
        try {
          for (const { name, value, options } of toSet)
            cookieStore.set(name, value, applyRemember(options, sessionOnly));
        } catch {
          // Виклик із серверного компонента: там cookies змінювати не можна, це нормально.
        }
      },
    },
  });
}
