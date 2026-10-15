/**
 * Мови сайту. Щоб додати мову: словник у `messages/<код>/` + рядок тут (і в `messages/index.ts`).
 * Чого бракує в перекладі — показується англійською. Мова за замовчуванням — англійська
 * (рішення власника: автовибору за мовою браузера немає, людина обирає сама).
 */
export const LOCALES = ["en", "uk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Назва мови її ж мовою, коротка позначка й код для форматування дат і чисел. */
export const LOCALE_INFO: Record<Locale, { name: string; short: string; intl: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", short: "EN", intl: "en-US", dir: "ltr" },
  uk: { name: "Українська", short: "UK", intl: "uk-UA", dir: "ltr" },
  ru: { name: "Русский", short: "RU", intl: "ru-RU", dir: "ltr" },
};

/** Cookie з обраною мовою (для тих, хто не ввійшов; тим, хто ввійшов, — ще й у профілі). */
export const LANG_COOKIE = "ym-lang";

export function hasLocale(value: string | null | undefined): value is Locale {
  return Boolean(value) && (LOCALES as readonly string[]).includes(value as string);
}

/** Шлях сайту з мовою: ("ru", "/catalog?q=1") → "/ru/catalog?q=1". Зовнішні й службові адреси — без змін. */
export function localePath(lang: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/") || path.startsWith("/auth/")) return path;
  const first = path.split(/[/?#]/)[1] ?? "";
  if (hasLocale(first)) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Той самий шлях іншою мовою: ("/uk/catalog?q=1", "en") → "/en/catalog?q=1". */
export function switchLocalePath(pathname: string, lang: Locale): string {
  const parts = pathname.split("/");
  if (hasLocale(parts[1])) parts[1] = lang;
  else parts.splice(1, 0, lang);
  const result = parts.join("/");
  return result.endsWith("/") && result.length > 1 ? result.slice(0, -1) : result;
}

/** Шлях без мови: "/uk/catalog" → "/catalog". */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (!hasLocale(parts[1])) return pathname;
  const rest = "/" + parts.slice(2).join("/");
  return rest === "/" ? "/" : rest.replace(/\/$/, "");
}
