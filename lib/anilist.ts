import { cacheLife } from "next/cache";
import { PAGE_SIZE, type CatalogQuery, type SortKey } from "./catalog";
import { rankByRelevance } from "./search";
import { searchTitleIndex } from "./titleIndex";

const ANILIST_URL = "https://graphql.anilist.co";

export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC";

export type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export type MediaCard = {
  id: number;
  title: { romaji: string | null; english: string | null };
  coverImage: { large: string | null; color: string | null };
  format: MediaFormat | null;
  seasonYear: number | null;
  startDate: { year: number | null };
  episodes: number | null;
  averageScore: number | null;
};

export type HomeSections = {
  season: { season: Season; year: number };
  trending: MediaCard[];
  seasonal: MediaCard[];
  popular: MediaCard[];
  top: MediaCard[];
};

const CARD_FIELDS = `
  id
  title { romaji english }
  coverImage { large color }
  format
  seasonYear
  startDate { year }
  episodes
  averageScore
`;

const HOME_QUERY = `
  query Home($season: MediaSeason, $year: Int, $perPage: Int) {
    trending: Page(perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: TRENDING_DESC) { ${CARD_FIELDS} }
    }
    seasonal: Page(perPage: $perPage) {
      media(type: ANIME, isAdult: false, season: $season, seasonYear: $year, sort: POPULARITY_DESC) { ${CARD_FIELDS} }
    }
    popular: Page(perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${CARD_FIELDS} }
    }
    top: Page(perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: SCORE_DESC) { ${CARD_FIELDS} }
    }
  }
`;

export class AniListError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(`AniList: ${status} ${message}`);
  }
}

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

async function anilist<T>(query: string, variables: Record<string, unknown>, attempt = 1): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (RETRY_STATUSES.has(res.status) && attempt < 2) {
    // Ліміт запитів або тимчасовий збій AniList: одна повторна спроба трохи згодом.
    const retryAfter = Number(res.headers.get("retry-after"));
    await new Promise((r) => setTimeout(r, Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000, 3000)));
    return anilist<T>(query, variables, attempt + 1);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.errors) {
    const error = json?.errors?.[0];
    throw new AniListError(error?.status ?? res.status, error?.message ?? res.statusText);
  }
  return json.data as T;
}

export type CatalogItem = MediaCard & {
  title: { native: string | null };
  synonyms: string[];
  popularity: number | null;
};

export type CatalogPage = {
  media: CatalogItem[];
  currentPage: number;
  hasNextPage: boolean;
};

const CATALOG_QUERY = `
  query Catalog(
    $page: Int, $perPage: Int, $sort: [MediaSort], $search: String,
    $genreIn: [String], $genreNotIn: [String], $tagIn: [String], $tagNotIn: [String],
    $season: MediaSeason, $seasonYear: Int, $startGreater: FuzzyDateInt, $startLesser: FuzzyDateInt,
    $formatIn: [MediaFormat], $statusIn: [MediaStatus], $statusNotIn: [MediaStatus],
    $episodesGreater: Int, $episodesLesser: Int, $scoreGreater: Int,
    $country: CountryCode, $sourceIn: [MediaSource], $idIn: [Int], $minTagRank: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage }
      media(
        type: ANIME, isAdult: false, sort: $sort, search: $search,
        genre_in: $genreIn, genre_not_in: $genreNotIn,
        tag_in: $tagIn, tag_not_in: $tagNotIn, minimumTagRank: $minTagRank,
        season: $season, seasonYear: $seasonYear,
        startDate_greater: $startGreater, startDate_lesser: $startLesser,
        format_in: $formatIn, status_in: $statusIn, status_not_in: $statusNotIn,
        episodes_greater: $episodesGreater, episodes_lesser: $episodesLesser,
        averageScore_greater: $scoreGreater, countryOfOrigin: $country, source_in: $sourceIn,
        id_in: $idIn
      ) {
        ${CARD_FIELDS}
        title { native }
        synonyms
        popularity
      }
    }
  }
`;

const SORT_ORDER: Record<SortKey, string[]> = {
  relevance: ["SEARCH_MATCH"],
  popular: ["POPULARITY_DESC", "ID"],
  score: ["SCORE_DESC", "POPULARITY_DESC", "ID"],
  trending: ["TRENDING_DESC", "POPULARITY_DESC", "ID"],
  newest: ["START_DATE_DESC", "POPULARITY_DESC", "ID"],
  oldest: ["START_DATE", "POPULARITY_DESC", "ID"],
};

const nonEmpty = <T>(list: T[]) => (list.length > 0 ? list : undefined);

/** Перетворює стан каталогу на змінні запиту AniList (порожні фільтри не передаються). */
function catalogVariables(query: CatalogQuery) {
  // Дати в AniList — числа РРРРММДД; невідомі місяць і день — нулі (20130000).
  let startGreater: number | undefined;
  let startLesser: number | undefined;
  let seasonYear: number | undefined;
  const singleYear = query.yearFrom !== undefined && query.yearFrom === query.yearTo;
  if (query.season && singleYear) {
    seasonYear = query.yearFrom; // «Осінь 2026» — саме сезон, а не дата першої серії
  } else {
    if (query.yearFrom !== undefined) startGreater = query.yearFrom * 10000 - 1;
    if (query.yearTo !== undefined) startLesser = (query.yearTo + 1) * 10000;
  }

  // «Спершу нові / старі»: без тайтлів без дати й без анонсів (якщо статус не вибрано).
  const byDate = query.sort === "newest" || query.sort === "oldest";
  if (byDate) startGreater = Math.max(startGreater ?? 0, 10000000);
  const statusNotIn = byDate && query.statuses.length === 0 ? ["NOT_YET_RELEASED"] : undefined;

  return {
    page: query.page,
    perPage: PAGE_SIZE,
    sort: SORT_ORDER[query.sort],
    search: query.q || undefined,
    genreIn: nonEmpty(query.genres),
    genreNotIn: nonEmpty(query.genresNot),
    tagIn: nonEmpty(query.tags),
    tagNotIn: nonEmpty(query.tagsNot),
    // Тег рахується, лише якщо AniList певен у ньому щонайменше на 40%
    // (інакше на «Isekai» першим виходить «Bleach» з упевненістю 25%).
    minTagRank: query.tags.length + query.tagsNot.length > 0 ? 40 : undefined,
    season: query.season,
    seasonYear,
    startGreater,
    startLesser,
    formatIn: nonEmpty(query.formats),
    statusIn: nonEmpty(query.statuses),
    statusNotIn,
    episodesGreater: query.episodes?.min !== undefined ? query.episodes.min - 1 : undefined,
    episodesLesser: query.episodes?.max !== undefined ? query.episodes.max + 1 : undefined,
    scoreGreater: query.minScore !== undefined ? Math.round(query.minScore * 10) - 1 : undefined,
    country: query.country,
    sourceIn: query.source ? [query.source] : undefined,
  };
}

type CatalogResponse = {
  Page: { pageInfo: { currentPage: number; hasNextPage: boolean }; media: CatalogItem[] };
};

/** Скільки тайтлів зі словника можна додати до першої сторінки пошуку. */
const INDEX_EXTRAS = 12;

export async function getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  "use cache";
  cacheLife("hours");

  const variables = catalogVariables(query);
  const data = await anilist<CatalogResponse>(CATALOG_QUERY, variables);
  let media = data.Page.media;

  if (query.sort === "relevance") {
    if (query.page === 1) {
      // AniList не знаходить за недописаним словом («frie», «spy fam»), тому додаємо
      // збіги зі словника популярних назв. Фільтри до них застосовує сам AniList.
      const known = new Set(media.map((m) => m.id));
      const extraIds = searchTitleIndex(query.q, 60)
        .filter((id) => !known.has(id))
        .slice(0, media.length > 0 ? INDEX_EXTRAS : PAGE_SIZE);
      if (extraIds.length > 0) {
        const extra = await anilist<CatalogResponse>(CATALOG_QUERY, {
          ...variables,
          search: undefined,
          idIn: extraIds,
          page: 1,
          sort: ["POPULARITY_DESC"],
        });
        media = [...media, ...extra.Page.media];
      }
    }
    media = rankByRelevance(query.q, media);
  }

  return {
    media,
    currentPage: data.Page.pageInfo.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

export type TagGroup = { category: string; tags: string[] };

export type FilterOptions = {
  /** Теги, згруповані за верхньою категорією ("Theme", "Cast"…), без дорослих. */
  tagGroups: TagGroup[];
  /** Найпізніший рік у списку років (наступний рік — для анонсів). */
  maxYear: number;
};

export async function getFilterOptions(): Promise<FilterOptions> {
  "use cache";
  cacheLife("days");

  const maxYear = new Date().getFullYear() + 1;
  const data = await anilist<{
    MediaTagCollection: { name: string; category: string; isAdult: boolean }[];
  }>(`query { MediaTagCollection { name category isAdult } }`, {});

  const groups = new Map<string, string[]>();
  for (const tag of data.MediaTagCollection) {
    if (tag.isAdult) continue;
    const category = tag.category.split("-")[0];
    groups.set(category, [...(groups.get(category) ?? []), tag.name]);
  }
  const order = ["Theme", "Cast", "Setting", "Demographic", "Technical"];
  const tagGroups = [...groups.entries()]
    .sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .map(([category, tags]) => ({ category, tags: tags.sort((a, b) => a.localeCompare(b)) }));

  return { tagGroups, maxYear };
}

/** Аніме-сезон за місяцем: зима — січень–березень, весна — квітень–червень і т. д. */
export function seasonOf(date: Date): { season: Season; year: number } {
  const seasons: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
  return { season: seasons[Math.floor(date.getMonth() / 3)], year: date.getFullYear() };
}

export async function getHomeSections(): Promise<HomeSections> {
  "use cache";
  cacheLife("hours");

  const current = seasonOf(new Date());
  type PageData = { media: MediaCard[] };
  const data = await anilist<Record<"trending" | "seasonal" | "popular" | "top", PageData>>(
    HOME_QUERY,
    { season: current.season, year: current.year, perPage: 12 },
  );

  return {
    season: current,
    trending: data.trending.media,
    seasonal: data.seasonal.media,
    popular: data.popular.media,
    top: data.top.media,
  };
}

export type MediaStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

export type FuzzyDate = { year: number | null; month: number | null; day: number | null };

export type RelationType =
  | "ADAPTATION"
  | "PREQUEL"
  | "SEQUEL"
  | "PARENT"
  | "SIDE_STORY"
  | "CHARACTER"
  | "SUMMARY"
  | "ALTERNATIVE"
  | "SPIN_OFF"
  | "OTHER"
  | "SOURCE"
  | "COMPILATION"
  | "CONTAINS";

export type MediaDetails = Omit<MediaCard, "startDate"> & {
  idMal: number | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { extraLarge: string | null; large: string | null; color: string | null };
  bannerImage: string | null;
  description: string | null;
  status: MediaStatus | null;
  duration: number | null;
  season: Season | null;
  startDate: FuzzyDate;
  endDate: FuzzyDate;
  popularity: number | null;
  stats: { scoreDistribution: { score: number; amount: number }[] } | null;
  genres: string[];
  source: string | null;
  countryOfOrigin: string | null;
  siteUrl: string;
  studios: { nodes: { id: number; name: string }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  tags: { name: string; rank: number; isMediaSpoiler: boolean; isGeneralSpoiler: boolean }[];
  relations: { edges: { relationType: RelationType; node: MediaCard & { type: "ANIME" | "MANGA" } }[] };
  recommendations: { nodes: { mediaRecommendation: (MediaCard & { isAdult: boolean }) | null }[] };
};

const MEDIA_QUERY = `
  query Media($id: Int) {
    Media(id: $id, type: ANIME) {
      ${CARD_FIELDS}
      idMal
      title { romaji english native }
      coverImage { extraLarge large color }
      bannerImage
      description(asHtml: false)
      status
      duration
      season
      startDate { year month day }
      endDate { year month day }
      popularity
      stats { scoreDistribution { score amount } }
      genres
      source(version: 3)
      countryOfOrigin
      siteUrl
      studios(isMain: true) { nodes { id name } }
      nextAiringEpisode { episode airingAt }
      tags { name rank isMediaSpoiler isGeneralSpoiler }
      relations { edges { relationType(version: 2) node { ${CARD_FIELDS} type } } }
      recommendations(perPage: 12, sort: RATING_DESC) {
        nodes { mediaRecommendation { ${CARD_FIELDS} isAdult } }
      }
    }
  }
`;

/** Повертає null, якщо такого аніме немає. */
export async function getMedia(id: number): Promise<MediaDetails | null> {
  "use cache";
  cacheLife("hours");

  try {
    const data = await anilist<{ Media: MediaDetails }>(MEDIA_QUERY, { id });
    return data.Media;
  } catch (error) {
    if (error instanceof AniListError && error.status === 404) return null;
    throw error;
  }
}

export type WatchOrderItem = Omit<MediaCard, "startDate"> & { startDate: FuzzyDate };

const CHAIN_QUERY = `
  query Chain($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${CARD_FIELDS}
        startDate { year month day }
        relations { edges { relationType node { id type } } }
      }
    }
  }
`;

const CHAIN_LIMIT = 40;

/**
 * Усі частини основної історії (ланцюжок «попередня / наступна частина»),
 * упорядковані за датою виходу. Якщо частина одна — порожній список.
 */
export async function getWatchOrder(id: number): Promise<WatchOrderItem[]> {
  "use cache";
  cacheLife("days");

  type ChainNode = WatchOrderItem & {
    relations: { edges: { relationType: RelationType; node: { id: number; type: string } }[] };
  };

  const found = new Map<number, WatchOrderItem>();
  const queued = new Set([id]);
  let frontier = [id];

  while (frontier.length > 0 && found.size < CHAIN_LIMIT) {
    const data = await anilist<{ Page: { media: ChainNode[] } }>(CHAIN_QUERY, { ids: frontier });
    const next: number[] = [];
    for (const { relations, ...media } of data.Page.media) {
      found.set(media.id, media);
      for (const edge of relations.edges) {
        const isChain = edge.relationType === "PREQUEL" || edge.relationType === "SEQUEL";
        if (isChain && edge.node.type === "ANIME" && !queued.has(edge.node.id)) {
          queued.add(edge.node.id);
          next.push(edge.node.id);
        }
      }
    }
    frontier = next.slice(0, CHAIN_LIMIT - found.size);
  }

  if (found.size < 2) return [];
  const dateKey = ({ year, month, day }: FuzzyDate) =>
    year == null ? Infinity : year * 10000 + (month ?? 12) * 100 + (day ?? 31);
  return [...found.values()].sort((a, b) => dateKey(a.startDate) - dateKey(b.startDate) || a.id - b.id);
}

// ---------------------------------------------------------------------------
// Серії

export type EpisodeInfo = {
  number: number;
  /** Назва з AniList (є не для всіх тайтлів). */
  title: string | null;
  /** Час виходу в секундах (Unix), якщо відомий. */
  airingAt: number | null;
  aired: boolean;
};

export type EpisodesData = {
  episodes: EpisodeInfo[];
  /** Скільки серій уже вийшло. */
  airedCount: number;
  /** Скільки серій буде всього, якщо відомо. */
  total: number | null;
};

const EPISODES_QUERY = `
  query Episodes($id: Int, $page: Int) {
    Media(id: $id, type: ANIME) {
      episodes
      status
      format
      nextAiringEpisode { episode }
      streamingEpisodes { title }
    }
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(mediaId: $id, sort: EPISODE_DESC) { episode airingAt }
    }
  }
`;

/** Скільки серій уже вийшло: для серіалів, що виходять, — до наступної серії. */
export function airedEpisodeCount(media: {
  status: string | null;
  episodes: number | null;
  nextAiringEpisode: { episode: number } | null;
}): number {
  if (media.nextAiringEpisode) return media.nextAiringEpisode.episode - 1;
  if (media.status === "NOT_YET_RELEASED") return 0;
  return media.episodes ?? 0;
}

/** «Episode 12 - Title» → [12, "Title"]. */
function parseStreamingTitle(raw: string): [number, string | null] | null {
  const match = /^Episode\s+(\d+)\s*(?:[-–:]\s*(.+))?$/i.exec(raw.trim());
  if (!match) return null;
  return [Number(match[1]), match[2]?.trim() || null];
}

const SCHEDULE_PAGES = 4; // до 200 найновіших серій із датами

export async function getEpisodes(id: number): Promise<EpisodesData> {
  "use cache";
  cacheLife("hours");

  type Response = {
    Media: {
      episodes: number | null;
      status: string | null;
      format: string | null;
      nextAiringEpisode: { episode: number } | null;
      streamingEpisodes: { title: string }[];
    };
    Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: { episode: number; airingAt: number }[] };
  };

  const first = await anilist<Response>(EPISODES_QUERY, { id, page: 1 });
  const schedule = [...first.Page.airingSchedules];
  let hasNext = first.Page.pageInfo.hasNextPage;
  for (let page = 2; hasNext && page <= SCHEDULE_PAGES; page++) {
    const next = await anilist<Response>(EPISODES_QUERY, { id, page });
    schedule.push(...next.Page.airingSchedules);
    hasNext = next.Page.pageInfo.hasNextPage;
  }

  const media = first.Media;
  const airedCount = airedEpisodeCount(media);
  const maxScheduled = Math.max(0, ...schedule.map((s) => s.episode));
  const count = Math.max(media.episodes ?? 0, maxScheduled, airedCount);

  const titles = new Map<number, string | null>();
  for (const s of media.streamingEpisodes) {
    const parsed = parseStreamingTitle(s.title);
    if (parsed && !titles.has(parsed[0])) titles.set(parsed[0], parsed[1]);
  }
  const dates = new Map(schedule.map((s) => [s.episode, s.airingAt]));

  return {
    episodes: Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: titles.get(i + 1) ?? null,
      airingAt: dates.get(i + 1) ?? null,
      aired: i + 1 <= airedCount,
    })),
    airedCount,
    total: media.episodes,
  };
}

// ---------------------------------------------------------------------------
// «Мої аніме»: дані про кілька тайтлів одним запитом

export type MyMedia = MediaCard & {
  status: MediaStatus | null;
  duration: number | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  /** Скільки серій уже вийшло. */
  airedCount: number;
  /** Коли вийшла остання серія (Unix, секунди), якщо відомо. */
  lastAiredAt: number | null;
};

const MY_MEDIA_QUERY = `
  query MyMedia($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${CARD_FIELDS}
        status
        duration
        nextAiringEpisode { episode airingAt }
      }
    }
    recent: Page(perPage: 50) {
      airingSchedules(mediaId_in: $ids, notYetAired: false, sort: TIME_DESC) { mediaId airingAt }
    }
  }
`;

/** До 50 тайтлів за раз (ліміт AniList); id мають бути відсортовані — так краще кешується. */
export async function getMyMediaChunk(ids: number[]): Promise<MyMedia[]> {
  "use cache";
  cacheLife("minutes");

  type Response = {
    Page: { media: (MediaCard & Pick<MyMedia, "status" | "duration" | "nextAiringEpisode">)[] };
    recent: { airingSchedules: { mediaId: number; airingAt: number }[] };
  };
  const data = await anilist<Response>(MY_MEDIA_QUERY, { ids });
  const lastAired = new Map<number, number>();
  for (const s of data.recent.airingSchedules) if (!lastAired.has(s.mediaId)) lastAired.set(s.mediaId, s.airingAt);

  return data.Page.media.map((m) => ({
    ...m,
    airedCount: airedEpisodeCount(m),
    lastAiredAt: lastAired.get(m.id) ?? null,
  }));
}

export async function getMyMedia(ids: number[]): Promise<MyMedia[]> {
  const unique = [...new Set(ids)].sort((a, b) => a - b);
  const chunks: number[][] = [];
  for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));
  const results = await Promise.all(chunks.map((chunk) => getMyMediaChunk(chunk)));
  return results.flat();
}
