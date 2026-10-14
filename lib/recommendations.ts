import { getHomeSections, getRecCards, getRecSeeds, type RecCard } from "./anilist";
import { formatUserScore, type ListStatus } from "./lists";

/**
 * Рекомендації без ШІ (узгоджено з власником 2026-10-14):
 * — основа — аніме зі списків «Дивлюся», «Переглянуто», «На паузі» з оцінками; «Кинув» і низькі оцінки
 *   відштовхують схожі; «Планую» — не основа;
 * — кандидати — «схожі» від глядачів AniList; вище ті, на які вказують кілька улюблених аніме, і ті,
 *   що збігаються зі смаком (жанри й теми з оцінок);
 * — продовження радимо з першої частини; аніме зі списків (крім «Планую») і «Не цікаво» не радимо.
 */

export type RecEntry = { id: number; status: ListStatus; score: number | null };

export type Recommendation = {
  media: Omit<RecCard, "tags" | "previous" | "isAdult">;
  /** Чому порадили: «Бо ви оцінили «X» на 9», «Схоже на «X» і «Y»», «Популярне на AniList». */
  reason: string;
};

export type RecommendationsResult = {
  items: Recommendation[];
  /** Скільки аніме зі списків вплинули на рекомендації позитивно. */
  basedOn: number;
};

/** Вага оцінки 0–10: 9–10 — сильно «подобається», 5 — нейтрально, 1–4 — «не подобається». */
const SCORE_WEIGHT = [-0.8, -0.8, -0.7, -0.5, -0.3, 0, 0.2, 0.5, 0.8, 1, 1];

export function seedWeight(status: ListStatus, score: number | null): number {
  if (status === "planning") return 0;
  const byScore = score === null ? null : SCORE_WEIGHT[Math.max(0, Math.min(10, Math.round(score)))];
  if (status === "dropped") return byScore === null ? -0.3 : Math.min(byScore - 0.5, -0.1);
  // Те, що людина дивиться зараз, важить трохи більше.
  if (byScore !== null) return byScore + (status === "watching" ? 0.1 : 0);
  return status === "watching" ? 0.7 : status === "completed" ? 0.5 : 0.3;
}

const MAX_SEEDS = 75;
const MAX_ITEMS = 120;
const SKIP_FORMATS = new Set(["MUSIC", "SPECIAL"]);

function suitable(card: RecCard): boolean {
  return !card.isAdult && !SKIP_FORMATS.has(card.format ?? "") && card.status !== "NOT_YET_RELEASED";
}

/** Без зайвого для браузера (теги, зв'язки). */
function strip(card: RecCard): Recommendation["media"] {
  return {
    id: card.id,
    title: card.title,
    coverImage: card.coverImage,
    format: card.format,
    seasonYear: card.seasonYear,
    startDate: card.startDate,
    episodes: card.episodes,
    averageScore: card.averageScore,
    status: card.status,
    popularity: card.popularity,
    genres: card.genres,
  };
}

export async function buildRecommendations(entries: RecEntry[], hidden: number[]): Promise<RecommendationsResult> {
  const exclude = new Set<number>(hidden);
  for (const e of entries) if (e.status !== "planning") exclude.add(e.id);

  const weights = new Map<number, number>();
  for (const e of entries) {
    const w = seedWeight(e.status, e.score);
    if (w !== 0) weights.set(e.id, w);
  }
  const seedIds = [...weights.keys()]
    .sort((a, b) => Math.abs(weights.get(b)!) - Math.abs(weights.get(a)!))
    .slice(0, MAX_SEEDS);
  const seeds = await getRecSeeds(seedIds);
  const entryOf = new Map(entries.map((e) => [e.id, e]));

  // ---- Смак: які жанри й теми людина оцінює високо, а які — низько ----
  const genreTaste = new Map<string, number>();
  const tagTaste = new Map<string, number>();
  let norm = 0;
  for (const seed of seeds) {
    const w = weights.get(seed.id)!;
    norm += Math.abs(w);
    for (const g of seed.genres) genreTaste.set(g, (genreTaste.get(g) ?? 0) + w);
    for (const t of seed.tags) if (t.rank >= 50) tagTaste.set(t.name, (tagTaste.get(t.name) ?? 0) + (w * t.rank) / 100);
  }
  const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
  function taste(card: RecCard): number {
    if (norm === 0) return 0;
    const g = mean(card.genres.map((x) => (genreTaste.get(x) ?? 0) / norm));
    const t = mean(
      card.tags
        .filter((x) => x.rank >= 60)
        .slice(0, 10)
        .map((x) => (tagTaste.get(x.name) ?? 0) / norm),
    );
    return 0.6 * g + 0.4 * t;
  }

  // ---- «Схожі» від кожного аніме користувача ----
  type Candidate = { score: number; from: Map<number, number> };
  const candidates = new Map<number, Candidate>();
  for (const seed of seeds) {
    const w = weights.get(seed.id)!;
    const top = Math.max(1, ...seed.recs.map((r) => r.rating));
    for (const { rating, media } of seed.recs) {
      if (rating <= 0 || !suitable(media)) continue;
      const c = w * (0.3 + 0.7 * Math.sqrt(rating / top));
      const item = candidates.get(media.id) ?? { score: 0, from: new Map() };
      item.score += c;
      item.from.set(seed.id, (item.from.get(seed.id) ?? 0) + c);
      candidates.set(media.id, item);
    }
  }

  // ---- Продовження → перша частина ----
  const ids = [...candidates.keys()]
    .sort((a, b) => Math.abs(candidates.get(b)!.score) - Math.abs(candidates.get(a)!.score))
    .slice(0, 250);
  const chains = new Map(ids.map((id) => [id, [id]]));
  let walking = ids;
  for (let step = 0; step < 5 && walking.length > 0; step++) {
    const cards = await getRecCards(walking.map((id) => chains.get(id)!.at(-1)!));
    const next: number[] = [];
    for (const id of walking) {
      const chain = chains.get(id)!;
      const previous = cards.get(chain.at(-1)!)?.previous;
      if (previous && !chain.includes(previous)) {
        chain.push(previous);
        next.push(id);
      }
    }
    walking = next;
  }
  const roots = await getRecCards(ids.map((id) => chains.get(id)!.at(-1)!));

  const merged = new Map<number, Candidate>();
  for (const id of ids) {
    const chain = chains.get(id)!;
    if (chain.some((x) => exclude.has(x))) continue;
    const rootId = chain.at(-1)!;
    const root = roots.get(rootId);
    if (!root || !suitable(root)) continue;
    const c = candidates.get(id)!;
    const item = merged.get(rootId) ?? { score: 0, from: new Map() };
    item.score += c.score;
    for (const [seed, v] of c.from) item.from.set(seed, (item.from.get(seed) ?? 0) + v);
    merged.set(rootId, item);
  }

  const seedTitle = new Map(seeds.map((s) => [s.id, s.title]));
  function reason(from: Map<number, number>): string {
    const liked = [...from].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const [first, second] = liked.map(([id]) => id);
    const score = entryOf.get(first)?.score ?? null;
    // Вказують кілька улюблених аніме — це найпереконливіше пояснення.
    if (second !== undefined) return `Схоже на «${seedTitle.get(first)}» і «${seedTitle.get(second)}»`;
    if (score !== null && score >= 8) return `Бо ви оцінили «${seedTitle.get(first)}» на ${formatUserScore(score)}`;
    return `Схоже на «${seedTitle.get(first)}»`;
  }

  const ranked = [...merged]
    .filter(([, c]) => c.score > 0)
    .map(([id, c]) => {
      const card = roots.get(id)!;
      const quality = ((card.averageScore ?? 65) - 70) / 30;
      return { card, c, total: c.score + 0.5 * taste(card) + 0.15 * quality };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, MAX_ITEMS);

  const items: Recommendation[] = ranked.map(({ card, c }) => ({ media: strip(card), reason: reason(c.from) }));

  // ---- Мало даних — доповнюємо популярним ----
  if (items.length < 30) {
    const home = await getHomeSections();
    const popularIds = [...home.trending, ...home.popular, ...home.top].map((m) => m.id);
    const cards = await getRecCards(popularIds);
    const taken = new Set(items.map((i) => i.media.id));
    for (const id of popularIds) {
      const card = cards.get(id);
      if (!card || taken.has(id) || exclude.has(id) || !suitable(card) || card.previous) continue;
      taken.add(id);
      items.push({ media: strip(card), reason: "Популярне на AniList" });
    }
  }

  const basedOn = seeds.filter((s) => weights.get(s.id)! > 0).length;
  return { items, basedOn };
}
