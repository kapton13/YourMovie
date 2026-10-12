/**
 * «Залишатися в системі».
 * Увімкнено (типово): cookies входу живуть довго (до 400 днів) і переживають закриття браузера.
 * Вимкнено: cookies входу стають «сеансовими» — браузер видаляє їх, коли його закривають.
 * Вибір зберігається в окремому сеансовому cookie, тож теж зникає разом із браузером.
 */
export const REMEMBER_COOKIE = "ym-session-only";

type CookieOptions = { maxAge?: number; expires?: Date; [key: string]: unknown };

/** Прибирає строк життя з cookie входу, якщо людина не хоче залишатися в системі. */
export function applyRemember<T extends CookieOptions>(options: T, sessionOnly: boolean): T {
  // maxAge 0 — це видалення cookie (вихід), його не чіпаємо.
  if (!sessionOnly || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
