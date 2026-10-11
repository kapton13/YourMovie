import rawIndex from "@/data/title-index.json";
import { matchTier, normalizeTitle, relevanceScore } from "./search";

/**
 * Словник назв ~3000 найпопулярніших аніме (оновлюється скриптом `npm run update-titles`).
 * Потрібен, бо AniList не шукає за недописаним словом: на «frie» він не знаходить нічого.
 */
type Entry = { id: number; popularity: number; titles: string[] };

const entries: Entry[] = (rawIndex as unknown as [number, number, ...string[]][]).map(
  ([id, popularity, ...titles]) => ({ id, popularity, titles: titles.map(normalizeTitle) }),
);

/** Id тайтлів, назви яких підходять під запит, від найкращого збігу. */
export function searchTitleIndex(query: string, limit: number): number[] {
  const normalizedQuery = normalizeTitle(query);
  if (normalizedQuery.length < 2) return [];

  const found: { id: number; score: number }[] = [];
  for (const entry of entries) {
    const tier = Math.max(...entry.titles.map((t) => matchTier(t, normalizedQuery)));
    // Лише впевнені збіги: усі слова цілі або останнє — початок слова.
    if (tier >= 1.5) found.push({ id: entry.id, score: relevanceScore(tier, entry.popularity) });
  }
  return found
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((f) => f.id);
}

// ---------------------------------------------------------------------------
// «Можливо, ви мали на увазі…»: виправлення одруківок за словами зі словника.

let vocabulary: Map<string, number> | undefined;

function getVocabulary(): Map<string, number> {
  if (!vocabulary) {
    vocabulary = new Map();
    for (const entry of entries)
      for (const title of entry.titles)
        for (const word of title.split(" "))
          if (word.length >= 3 && (vocabulary.get(word) ?? 0) < entry.popularity) vocabulary.set(word, entry.popularity);
  }
  return vocabulary;
}

/** Відстань між словами: скільки літер вставити, прибрати, замінити чи переставити. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array<number>(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, prev2[j - 2] + 1);
      row.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = row;
  }
  return prev[b.length];
}

/** «friren» → «frieren». Повертає null, якщо виправляти нічого. */
export function suggestCorrection(query: string): string | null {
  const words = normalizeTitle(query).split(" ").filter(Boolean);
  if (words.length === 0) return null;
  const vocab = getVocabulary();
  let changed = false;

  const corrected = words.map((word) => {
    if (word.length < 4 || vocab.has(word)) return word;
    const max = word.length >= 7 ? 2 : 1;
    let best: { word: string; distance: number; popularity: number } | undefined;
    for (const [candidate, popularity] of vocab) {
      const distance = editDistance(word, candidate, max);
      if (
        distance <= max &&
        (!best || distance < best.distance || (distance === best.distance && popularity > best.popularity))
      )
        best = { word: candidate, distance, popularity };
    }
    if (!best) return word;
    changed = true;
    return best.word;
  });

  return changed ? corrected.join(" ") : null;
}
