import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";
import ja from "./ja";
import ko from "./ko";
import pl from "./pl";
import pt from "./pt";
import ru from "./ru";
import tr from "./tr";
import uk from "./uk";
import zh from "./zh";

/** Повний набір текстів сайту — за зразком англійського словника. */
export type Messages = typeof en;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/**
 * Словники мов. Нова мова може бути неповною (`DeepPartial`): чого бракує — береться з англійської.
 */
const dictionaries: Record<Locale, DeepPartial<Messages>> = { en, uk, ru, es, pt, fr, de, pl, tr, ja, ko, zh };

function merge<T>(base: T, extra: unknown): T {
  if (!extra || typeof extra !== "object" || typeof base !== "object" || base === null) return (extra ?? base) as T;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(extra as Record<string, unknown>)) {
    const current = result[key];
    result[key] =
      value && typeof value === "object" && current && typeof current === "object" && !Array.isArray(value)
        ? merge(current, value)
        : (value ?? current);
  }
  return result as T;
}

const cache = new Map<Locale, Messages>();

export function messagesFor(lang: Locale): Messages {
  let messages = cache.get(lang);
  if (!messages) {
    messages = lang === DEFAULT_LOCALE ? en : merge(en, dictionaries[lang]);
    cache.set(lang, messages);
  }
  return messages;
}
