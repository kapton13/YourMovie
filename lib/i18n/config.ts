/**
 * Мови сайту. Щоб додати мову: словник у `messages/<код>/` + рядок тут (і в `messages/index.ts`).
 * Чого бракує в перекладі — показується англійською. Мова за замовчуванням — англійська
 * (рішення власника: автовибору за мовою браузера немає, людина обирає сама).
 */
export const LOCALES = ["en", "uk", "ru", "es", "pt", "fr", "de", "pl", "tr", "ja", "ko", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Назва мови її ж мовою, коротка позначка й код для форматування дат і чисел. */
export const LOCALE_INFO: Record<Locale, { name: string; short: string; intl: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", short: "EN", intl: "en-US", dir: "ltr" },
  uk: { name: "Українська", short: "UK", intl: "uk-UA", dir: "ltr" },
  ru: { name: "Русский", short: "RU", intl: "ru-RU", dir: "ltr" },
  es: { name: "Español", short: "ES", intl: "es-ES", dir: "ltr" },
  pt: { name: "Português", short: "PT", intl: "pt-BR", dir: "ltr" },
  fr: { name: "Français", short: "FR", intl: "fr-FR", dir: "ltr" },
  de: { name: "Deutsch", short: "DE", intl: "de-DE", dir: "ltr" },
  pl: { name: "Polski", short: "PL", intl: "pl-PL", dir: "ltr" },
  tr: { name: "Türkçe", short: "TR", intl: "tr-TR", dir: "ltr" },
  ja: { name: "日本語", short: "JA", intl: "ja-JP", dir: "ltr" },
  ko: { name: "한국어", short: "KO", intl: "ko-KR", dir: "ltr" },
  zh: { name: "中文", short: "ZH", intl: "zh-CN", dir: "ltr" },
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
