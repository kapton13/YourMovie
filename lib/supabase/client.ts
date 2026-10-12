import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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

let client: SupabaseClient | undefined;

/** Клієнт Supabase для браузера. Сесія зберігається в cookies, тож її бачить і сервер. */
export function getSupabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => readCookies(),
      setAll: (toSet) => {
        const sessionOnly = isSessionOnly();
        for (const { name, value, options } of toSet) writeCookie(name, value, applyRemember(options, sessionOnly));
      },
    },
  });
  return client;
}
