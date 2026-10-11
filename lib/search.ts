/**
 * Допомога для пошуку за назвою: власне ранжування результатів AniList
 * і підказка для запитів кирилицею.
 */

/** Нижній регістр, без діакритики й розділових знаків: "Re:ZERO -Starting…" → "re zero starting". */
export function normalizeTitle(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Наскільки добре назва збігається із запитом (обидва вже нормалізовані):
 * 4 — точно, 3 — назва починається із запиту, 2 — є всі слова запиту,
 * 1.5 — є всі слова, а останнє лише починається (його ще дописують: «spy fam»),
 * 1 — слова трапляються всередині інших слів, -1 — видимого збігу немає.
 */
export function matchTier(title: string, query: string): number {
  if (!title || !query) return -1;
  if (title === query) return 4;
  if (title.startsWith(query)) return 3;
  const words = query.split(" ");
  const titleWords = title.split(" ");
  if (words.every((w) => titleWords.includes(w))) return 2;
  const last = words[words.length - 1];
  if (words.slice(0, -1).every((w) => titleWords.includes(w)) && titleWords.some((t) => t.startsWith(last)))
    return 1.5;
  if (words.every((w) => title.includes(w))) return 1;
  return -1;
}

/**
 * Оцінка для впорядкування: якість збігу плюс популярність
 * (крок збігу важить стільки ж, скільки вдесятеро більша популярність).
 * Так «naru» дає спершу «Naruto», а не маловідоме «Ane Naru Mono».
 */
export function relevanceScore(tier: number, popularity: number | null | undefined): number {
  return tier + Math.log10((popularity ?? 0) + 10);
}

type Searchable = {
  title: { romaji: string | null; english: string | null; native?: string | null };
  synonyms?: string[] | null;
  popularity?: number | null;
};

/**
 * AniList у режимі «за збігом» часто ставить маловідомі тайтли вище популярних
 * (на «spy» — спершу «Spy Classroom», а «SPY x FAMILY» лише третім),
 * тому результати переставляємо за власною оцінкою.
 */
export function rankByRelevance<T extends Searchable>(query: string, items: T[]): T[] {
  const normalizedQuery = normalizeTitle(query);
  if (!normalizedQuery) return items;

  return items
    .map((item, index) => {
      const titles = [item.title.english, item.title.romaji, item.title.native, ...(item.synonyms ?? [])];
      const tier = Math.max(...titles.map((t) => (t ? matchTier(normalizeTitle(t), normalizedQuery) : -1)));
      return { item, index, score: relevanceScore(tier, item.popularity) };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

const CYRILLIC = /\p{Script=Cyrillic}/u;

export function hasCyrillic(text: string): boolean {
  return CYRILLIC.test(text);
}

// Японські назви, записані кирилицею (системи Поліванова й Коваленка), → латиниця.
const MULTI: [string, string][] = [
  ["дзю", "ju"], ["дзя", "ja"], ["дзё", "jo"], ["дзи", "ji"], ["дзі", "ji"],
  ["ся", "sha"], ["сю", "shu"], ["сё", "sho"], ["си", "shi"], ["сі", "shi"],
  ["тя", "cha"], ["тю", "chu"], ["тё", "cho"], ["ти", "chi"], ["ті", "chi"],
  ["цу", "tsu"], ["дз", "z"],
];

const SINGLE: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", ё: "yo", є: "ye", ж: "j",
  з: "z", и: "i", і: "i", ї: "yi", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", "'": "", "’": "",
};

/** "Наруто" → "naruto", "Гінтама" → "gintama", "Сингэки но Кёдзин" → "shingeki no kyojin". */
export function transliterate(text: string): string {
  const lower = text.toLowerCase();
  let result = "";
  for (let i = 0; i < lower.length; ) {
    const multi = MULTI.find(([cyr]) => lower.startsWith(cyr, i));
    if (multi) {
      result += multi[1];
      i += multi[0].length;
    } else {
      const ch = lower[i];
      result += SINGLE[ch] ?? ch;
      i += 1;
    }
  }
  return result.replace(/\s+/g, " ").trim();
}
