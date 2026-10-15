import { lang as rootLang } from "next/root-params";
import { messagesFor } from "@/messages";
import { DEFAULT_LOCALE, LOCALE_INFO, hasLocale, localePath, type Locale } from "./config";

/** Мова поточної сторінки (з адреси: /en/..., /uk/...). Для серверних компонентів. */
export async function getLang(): Promise<Locale> {
  const value = await rootLang();
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

/** Тексти поточної мови, мова й допоміжне для серверних компонентів. */
export async function getI18n() {
  const lang = await getLang();
  return { lang, m: messagesFor(lang), intl: LOCALE_INFO[lang].intl, href: (path: string) => localePath(lang, path) };
}
