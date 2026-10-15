import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_INFO, localePath, stripLocale, switchLocalePath, type Locale } from "@/lib/i18n/config";
import { count, fmt, plural, type Plural } from "@/lib/i18n/format";
import { animeTitle } from "@/lib/i18n/title";
import { messagesFor, type Messages } from "@/messages";
import en from "@/messages/en";

/**
 * Мови сайту: кожна мова має всі тексти англійської, з тими самими місцями для значень ({n}, {title}…),
 * з усіма формами множини своєї мови й перекладеними тегами. Нова мова з LOCALES одразу потрапляє сюди.
 */

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);
const isPlural = (v: unknown): v is Plural =>
  typeof v === "object" && v !== null && "other" in v && Object.keys(v).every((k) => PLURAL_KEYS.has(k));
const placeholders = (s: string) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

/** Теги перевіряємо окремо: англійською вони — як є (порожній словник). */
function withoutTags(messages: Messages): Omit<Messages, "tags"> {
  const copy: Partial<Messages> = { ...messages };
  delete copy.tags;
  return copy as Omit<Messages, "tags">;
}

async function load(lang: Locale): Promise<Messages> {
  return (await import(`../../messages/${lang}/index.ts`)).default as Messages;
}

type Problem = string;
function compare(base: unknown, other: unknown, intl: string, path: string, problems: Problem[]) {
  if (typeof base === "string") {
    if (typeof other !== "string" || !other.trim()) return problems.push(`${path}: немає перекладу`);
    const want = placeholders(base);
    const got = placeholders(other);
    if ([...want].some((p) => !got.has(p)) || [...got].some((p) => !want.has(p)))
      problems.push(`${path}: місця для значень ${[...got]} замість ${[...want]}`);
    return;
  }
  if (isPlural(base)) {
    if (!isPlural(other)) return problems.push(`${path}: має бути формами множини`);
    // Форми, які мова вживає для цілих чисел (французьке/іспанське «many» — лише для мільйонів, там годиться «other»).
    const rules = new Intl.PluralRules(intl);
    const needed = new Set(Array.from({ length: 1001 }, (_, n) => rules.select(n)));
    for (const category of needed)
      if (!other[category as keyof Plural]) problems.push(`${path}: бракує форми «${category}»`);
    const want = placeholders(base.other);
    want.delete("n");
    for (const [form, text] of Object.entries(other)) {
      const got = placeholders(text as string);
      got.delete("n"); // {n} у формі необов'язкове: count() інакше ставить число перед словом
      if ([...want].some((p) => !got.has(p))) problems.push(`${path}.${form}: бракує місць для значень`);
    }
    return;
  }
  if (typeof base === "object" && base !== null) {
    if (typeof other !== "object" || other === null) return problems.push(`${path}: немає розділу`);
    for (const key of Object.keys(base)) compare((base as never)[key], (other as never)[key], intl, `${path}.${key}`, problems);
    for (const key of Object.keys(other)) if (!(key in base)) problems.push(`${path}.${key}: зайвий ключ`);
  }
}

describe("налаштування мов", () => {
  it("кожна мова має опис і словник", async () => {
    expect(Object.keys(LOCALE_INFO).sort()).toEqual([...LOCALES].sort());
    for (const lang of LOCALES) {
      expect(await load(lang), lang).toBeTruthy();
      expect(() => new Intl.NumberFormat(LOCALE_INFO[lang].intl), lang).not.toThrow();
    }
  });

  it("мова в профілі проходить перевірку бази (supabase/009)", () => {
    const sql = readFileSync("supabase/009_profile_language.sql", "utf8");
    const pattern = new RegExp(sql.match(/language ~ '(.+?)'/)![1]);
    for (const lang of LOCALES) expect(pattern.test(lang), lang).toBe(true);
  });
});

describe.each(LOCALES.filter((l) => l !== "en"))("мова %s", (lang) => {
  it("усі тексти перекладено, місця для значень і форми множини на місці", async () => {
    const dict = await load(lang);
    const problems: Problem[] = [];
    compare(withoutTags(en), withoutTags(dict), LOCALE_INFO[lang].intl, lang, problems);
    expect(problems).toEqual([]);
  });

  it("усі теги перекладено", async () => {
    const reference = Object.keys((await load("uk")).tags).sort();
    expect(reference.length).toBeGreaterThan(300);
    const tags = (await load(lang)).tags;
    expect(Object.keys(tags).sort()).toEqual(reference);
    expect(Object.values(tags).every((t) => t.trim().length > 0)).toBe(true);
  });

  it("статуси названо однаково на всіх сторінках", async () => {
    const m = await load(lang);
    expect(m.my.statuses).toEqual(m.list.statuses);
    for (const [key, name] of Object.entries(m.list.statuses)) expect(m.profile.status[key]).toBe(name);
  });
});

describe("адреси з мовою", () => {
  it("додає мову, але не до службових і вже мовних адрес", () => {
    expect(localePath("uk", "/catalog?q=1")).toBe("/uk/catalog?q=1");
    expect(localePath("ja", "/")).toBe("/ja");
    expect(localePath("uk", "/api/franchises")).toBe("/api/franchises");
    expect(localePath("uk", "/auth/callback")).toBe("/auth/callback");
    expect(localePath("uk", "/en/my")).toBe("/en/my");
    expect(localePath("uk", "//evil.com")).toBe("//evil.com");
  });

  it("перемикання мови зберігає сторінку", () => {
    expect(switchLocalePath("/uk/catalog", "zh")).toBe("/zh/catalog");
    expect(switchLocalePath("/catalog", "de")).toBe("/de/catalog");
    expect(switchLocalePath("/ru", "en")).toBe("/en");
    expect(stripLocale("/ko/u/nick")).toBe("/u/nick");
  });
});

describe("тексти з числами", () => {
  it("множина за правилами мови", () => {
    const uk = messagesFor("uk").common.episodes;
    expect(count(uk, 1, "uk-UA")).toBe("1 серія");
    expect(count(uk, 3, "uk-UA")).toBe("3 серії");
    expect(count(uk, 5, "uk-UA")).toBe("5 серій");
    expect(count(messagesFor("en").common.episodes, 1, "en-US")).toBe("1 episode");
    expect(plural({ one: "a", other: "b" }, 2, "en-US")).toBe("b");
    expect(fmt("Сезон {n}", { n: 2 })).toBe("Сезон 2");
  });

  it("число всередині форми (японська, корейська)", () => {
    expect(count({ one: "{n}話", other: "{n}話" }, 12, "ja-JP")).toBe("12話");
  });
});

describe("назва аніме мовою сайту", () => {
  const titles = { romaji: "Shingeki no Kyojin", english: "Attack on Titan", native: "進撃の巨人", russian: "Атака титанов" };
  it("російською — з Shikimori, японською — оригінал, інші — англійською", () => {
    expect(animeTitle(titles, "ru")).toBe("Атака титанов");
    expect(animeTitle(titles, "ja")).toBe("進撃の巨人");
    expect(animeTitle(titles, "uk")).toBe("Attack on Titan");
    expect(animeTitle({ romaji: "Shingeki no Kyojin", english: null }, "de")).toBe("Shingeki no Kyojin");
    expect(animeTitle({ romaji: "X", english: null, native: null }, "ja")).toBe("X");
  });
});
