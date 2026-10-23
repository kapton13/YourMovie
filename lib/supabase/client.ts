import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { REMEMBER_COOKIE, applyRemember } from "./remember";

type CookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

function readCookies(): { name: string; value: string }[] {
  if (!document.cookie) return [];
  return document.cookie.split("; ").map((pair) => {
    const index = pair.indexOf("=");
    return { name: decodeURIComponent(pair.slice(0, index)), value: decodeURIComponent(pair.slice(index + 1)) };
  });
}

function writeCookie(name: string, value: string, options: CookieOptions) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${options.path ?? "/"}`;
  if (options.maxAge !== undefined) cookie += `; max-age=${options.maxAge}`;
  if (options.expires) cookie += `; expires=${options.expires.toUTCString()}`;
  if (options.domain) cookie += `; domain=${options.domain}`;
  const sameSite = options.sameSite === true ? "strict" : options.sameSite || "lax";
  cookie += `; samesite=${sameSite}`;
  if (options.secure || location.protocol === "https:") cookie += "; secure";
  document.cookie = cookie;
}

export function isSessionOnly(): boolean {
  return readCookies().some((c) => c.name === REMEMBER_COOKIE && c.value === "1");
}

/** Запам'ятати вибір «Залишатися в системі» (до входу). */
export function setRemember(remember: boolean) {
  writeCookie(REMEMBER_COOKIE, "1", remember ? { maxAge: 0 } : {});
}

/*
 * Бібліотека Supabase (≈70 КБ стиснутого коду — третина всього JavaScript сайту) вантажиться окремо й лише
 * коли потрібна: гостю на звичайних сторінках вона не потрібна зовсім, а тому, хто ввійшов, — уже після
 * того, як сторінка з'явилась.
 */
let client: SupabaseClient | undefined;
let loading: Promise<SupabaseClient> | undefined;
const userListeners = new Set<(user: User | null) => void>();

/** Клієнт Supabase для браузера (вантажиться при першому виклику). Сесія — у cookies, її бачить і сервер. */
export function loadSupabase(): Promise<SupabaseClient> {
  loading ??= import("@supabase/ssr").then(({ createBrowserClient }) => {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => readCookies(),
        setAll: (toSet) => {
          const sessionOnly = isSessionOnly();
          for (const { name, value, options } of toSet) writeCookie(name, value, applyRemember(options, sessionOnly));
        },
      },
    });
    client.auth.onAuthStateChange((_event, session) => {
      for (const listener of userListeners) listener(session?.user ?? null);
    });
    return client;
  });
  return loading;
}

/**
 * Уже завантажений клієнт — для коду, що працює лише для того, хто ввійшов (а щоб дізнатися, що людина
 * ввійшла, `useUser` уже завантажив бібліотеку). Для решти — `await loadSupabase()`.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!client) throw new Error("Supabase is not loaded yet — use loadSupabase()");
  return client;
}

/** Чи є в браузері сесія (cookie входу `sb-<проєкт>-auth-token`, можливо частинами). Без неї бібліотека не потрібна. */
export function hasSession(): boolean {
  return readCookies().some((c) => /^sb-[a-z0-9]+-auth-token(\.\d+)?$/.test(c.name) && c.value !== "");
}

/** Слухати вхід і вихід (спрацює, щойно бібліотеку завантажать: хоч для перевірки сесії, хоч формою входу). */
export function onUserChange(listener: (user: User | null) => void): () => void {
  userListeners.add(listener);
  return () => userListeners.delete(listener);
}
