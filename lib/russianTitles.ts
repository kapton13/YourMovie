import ruTitles from "@/data/ru-titles.json";

/** Російські назви найпопулярніших аніме з Shikimori (`npm run update-ru-titles`), за id AniList. */
const titles = ruTitles as Record<string, string>;

/**
 * Додає `title.russian` усім аніме у відповіді AniList, для яких назва відома.
 * Так російська версія сайту показує російські назви без окремих запитів до Shikimori.
 */
export function attachRussianTitles(data: unknown): void {
  const seen = new Set<object>();
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    const record = value as Record<string, unknown>;
    const title = record.title as Record<string, unknown> | undefined;
    if (typeof record.id === "number" && title && typeof title === "object" && "romaji" in title) {
      title.russian = titles[record.id] ?? null;
    }
    for (const child of Object.values(record)) walk(child);
  };
  walk(data);
}
