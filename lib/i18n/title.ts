import type { Locale } from "./config";

export type Titles = { romaji?: string | null; english?: string | null; russian?: string | null };

/**
 * Назва аніме для мови сайту: російською — з Shikimori (якщо відома), інакше англійська, потім ромадзі.
 * Порожній рядок — назви немає (компонент покаже «Без назви» потрібною мовою).
 */
export function animeTitle(title: Titles | null | undefined, lang: Locale): string {
  if (!title) return "";
  if (lang === "ru" && title.russian) return title.russian;
  return title.english ?? title.romaji ?? "";
}
