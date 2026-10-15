/**
 * Стан каталогу (пошук, фільтри, сортування, сторінка) і його запис в адресі сторінки.
 * Файл використовується і на сервері, і в браузері, тому не імпортує нічого серверного.
 *
 * Приклад адреси:
 * /catalog?q=titan&genres=action,drama&genres_not=romance&tags=Isekai&year=2010-2015
 *        &season=fall&format=tv,movie&status=finished&episodes=13-26&score=7.5
 *        &country=jp&source=manga&sort=score&page=2
 */
import type { Messages } from "@/messages";
import type { MediaFormat, MediaStatus, Season } from "./anilist";
import { count, fmt } from "./i18n/format";

export type SortKey = "relevance" | "popular" | "score" | "trending" | "newest" | "oldest";

export type Range = { min?: number; max?: number };

export type CatalogQuery = {
  /** Текст пошуку за назвою. */
  q: string;
  /** Жанри (назви як в AniList: "Action", "Slice of Life"). */
  genres: string[];
  genresNot: string[];
  /** Теги AniList ("Isekai", "Time Travel"). */
  tags: string[];
  tagsNot: string[];
  yearFrom?: number;
  yearTo?: number;
  season?: Season;
  formats: MediaFormat[];
  statuses: MediaStatus[];
  episodes?: Range;
  /** Мінімальна оцінка за шкалою 1–10. */
  minScore?: number;
  /** Код країни AniList: "JP", "CN", "KR", "TW". */
  country?: string;
  /** Першоджерело AniList: "MANGA", "LIGHT_NOVEL"… */
  source?: string;
  sort: SortKey;
  page: number;
};

export const MIN_YEAR = 1940;
export const PAGE_SIZE = 48;
const MAX_LIST = 15;

// ---------------------------------------------------------------------------
// Варіанти фільтрів і їхні короткі назви в адресі

/** Жанри AniList без «Hentai» (сайт не показує дорослий контент). */
export const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

export const FORMATS: MediaFormat[] = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];

export const STATUSES: MediaStatus[] = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "HIATUS", "CANCELLED"];

export const SEASONS: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

export const COUNTRIES = ["JP", "CN", "KR", "TW"];

/** Лише ті першоджерела, які AniList приймає у фільтрі. */
export const SOURCES = [
  "MANGA",
  "LIGHT_NOVEL",
  "WEB_NOVEL",
  "NOVEL",
  "ORIGINAL",
  "VISUAL_NOVEL",
  "VIDEO_GAME",
  "OTHER",
];

export const SORTS: SortKey[] = ["relevance", "popular", "score", "trending", "newest", "oldest"];

/** Варіанти кількості серій (як в адресі). Підписи — `episodePresetLabel`. */
export const EPISODE_PRESETS = ["1", "2-12", "13-26", "27-52", "53-100", "101-"];

/** Підпис варіанта кількості серій потрібною мовою: «1 серія», «2–12», «Понад 100». */
export function episodePresetLabel(value: string, m: Messages, intl: string): string {
  if (value === "1") return count(m.common.episodes, 1, intl);
  if (value === "101-") return m.catalog.episodes.over100;
  return value.replace("-", "–");
}

export const SCORE_PRESETS = [5, 6, 7, 7.5, 8, 8.5, 9];

const STATUS_SLUGS: Record<MediaStatus, string> = {
  RELEASING: "releasing",
  FINISHED: "finished",
  NOT_YET_RELEASED: "upcoming",
  HIATUS: "hiatus",
  CANCELLED: "cancelled",
};

/** "Slice of Life" → "slice-of-life", "LIGHT_NOVEL" → "light-novel". */
function slugify(value: string): string {
  return value.toLowerCase().replace(/[\s_]+/g, "-");
}

function slugMap<T extends string>(values: readonly T[], toSlug: (v: T) => string = slugify) {
  const bySlug = new Map(values.map((v) => [toSlug(v), v]));
  return { toSlug, fromSlug: (slug: string) => bySlug.get(slug.toLowerCase()) };
}

const genreSlugs = slugMap(GENRES);
const formatSlugs = slugMap(FORMATS);
const statusSlugs = slugMap(STATUSES, (s) => STATUS_SLUGS[s]);
const seasonSlugs = slugMap(SEASONS);
const countrySlugs = slugMap(COUNTRIES);
const sourceSlugs = slugMap(SOURCES);

// ---------------------------------------------------------------------------
// Читання з адреси

export type ParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function reader(params: ParamsInput) {
  return (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
}

function parseList<T>(raw: string | undefined, fromSlug: (slug: string) => T | undefined): T[] {
  if (!raw) return [];
  const result: T[] = [];
  for (const part of raw.split(",")) {
    const value = fromSlug(part.trim());
    if (value !== undefined && !result.includes(value)) result.push(value);
    if (result.length >= MAX_LIST) break;
  }
  return result;
}

function parseTags(raw: string | undefined): string[] {
  return parseList(raw, (tag) => (tag && tag.length <= 60 ? tag : undefined));
}

function parseInt10(value: string | undefined, min: number, max: number): number | undefined {
  if (!value || !/^\d{1,4}$/.test(value)) return undefined;
  const n = Number(value);
  return n >= min && n <= max ? n : undefined;
}

/** "2013", "2010-2015", "2010-", "-2015" → межі діапазону. */
export function parseRange(raw: string | undefined, min: number, max: number): Range | undefined {
  if (!raw) return undefined;
  const match = /^(\d*)(-?)(\d*)$/.exec(raw.trim());
  if (!match) return undefined;
  const [, a, dash, b] = match;
  let from = parseInt10(a, min, max);
  let to = dash ? parseInt10(b, min, max) : from;
  if (from === undefined && to === undefined) return undefined;
  if (from !== undefined && to !== undefined && from > to) [from, to] = [to, from];
  return { min: from, max: to };
}

function parseScore(raw: string | undefined): number | undefined {
  if (!raw || !/^\d{1,2}(\.\d)?$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= 1 && n <= 10 ? n : undefined;
}

export function defaultSort(q: string): SortKey {
  return q ? "relevance" : "popular";
}

export function parseCatalogParams(params: ParamsInput): CatalogQuery {
  const get = reader(params);
  const q = (get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  const genres = parseList(get("genres"), genreSlugs.fromSlug);
  const tags = parseTags(get("tags"));
  const years = parseRange(get("year"), 1900, 2100);

  let sort = SORTS.find((s) => s === get("sort")) ?? defaultSort(q);
  if (sort === "relevance" && !q) sort = "popular";

  return {
    q,
    genres,
    genresNot: parseList(get("genres_not"), genreSlugs.fromSlug).filter((g) => !genres.includes(g)),
    tags,
    tagsNot: parseTags(get("tags_not")).filter((t) => !tags.includes(t)),
    yearFrom: years?.min,
    yearTo: years?.max,
    season: seasonSlugs.fromSlug(get("season") ?? ""),
    formats: parseList(get("format"), formatSlugs.fromSlug),
    statuses: parseList(get("status"), statusSlugs.fromSlug),
    episodes: parseRange(get("episodes"), 1, 5000),
    minScore: parseScore(get("score")),
    country: countrySlugs.fromSlug(get("country") ?? ""),
    source: sourceSlugs.fromSlug(get("source") ?? ""),
    sort,
    page: parseInt10(get("page"), 1, 500) ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Запис в адресу

export const EMPTY_QUERY: CatalogQuery = {
  q: "",
  genres: [],
  genresNot: [],
  tags: [],
  tagsNot: [],
  formats: [],
  statuses: [],
  sort: "popular",
  page: 1,
};

export function rangeToParam(range: Range | undefined): string | undefined {
  if (!range || (range.min === undefined && range.max === undefined)) return undefined;
  if (range.min !== undefined && range.min === range.max) return String(range.min);
  return `${range.min ?? ""}-${range.max ?? ""}`;
}

export function catalogHref(partial: Partial<CatalogQuery>): string {
  const query = { ...EMPTY_QUERY, ...partial };
  if (!partial.sort) query.sort = defaultSort(query.q);

  const parts: string[] = [];
  const add = (key: string, value: string | undefined) => {
    if (value) parts.push(`${key}=${value}`);
  };
  const list = <T extends string>(values: T[], toSlug: (v: T) => string) =>
    values.map((v) => encodeURIComponent(toSlug(v))).join(",");

  add("q", query.q && encodeURIComponent(query.q));
  add("genres", list(query.genres, genreSlugs.toSlug));
  add("genres_not", list(query.genresNot, genreSlugs.toSlug));
  add("tags", list(query.tags, (t) => t));
  add("tags_not", list(query.tagsNot, (t) => t));
  add("year", rangeToParam({ min: query.yearFrom, max: query.yearTo }));
  add("season", query.season && seasonSlugs.toSlug(query.season));
  add("format", list(query.formats, formatSlugs.toSlug));
  add("status", list(query.statuses, statusSlugs.toSlug));
  add("episodes", rangeToParam(query.episodes));
  add("score", query.minScore !== undefined ? String(query.minScore) : undefined);
  add("country", query.country && countrySlugs.toSlug(query.country));
  add("source", query.source && sourceSlugs.toSlug(query.source));
  if (query.sort !== defaultSort(query.q)) add("sort", query.sort);
  if (query.page > 1) add("page", String(query.page));

  return parts.length ? `/catalog?${parts.join("&")}` : "/catalog";
}

// ---------------------------------------------------------------------------
// Підписи

/** Скільки фільтрів увімкнено (без пошуку, сортування й сторінки). */
export function countFilters(query: CatalogQuery): number {
  return (
    query.genres.length +
    query.genresNot.length +
    query.tags.length +
    query.tagsNot.length +
    query.formats.length +
    query.statuses.length +
    (query.yearFrom !== undefined || query.yearTo !== undefined ? 1 : 0) +
    (query.season ? 1 : 0) +
    (query.episodes ? 1 : 0) +
    (query.minScore !== undefined ? 1 : 0) +
    (query.country ? 1 : 0) +
    (query.source ? 1 : 0)
  );
}

/** Заголовок каталогу потрібною мовою: «Пошук: «…»», «Аніме 2024 року», «Жанр: Драма»… */
export function catalogTitle(query: CatalogQuery, m: Messages): string {
  const t = m.catalog.title;
  if (query.q) return fmt(t.search, { q: query.q });

  const filters = countFilters(query);
  const singleYear =
    query.yearFrom !== undefined && query.yearFrom === query.yearTo ? query.yearFrom : undefined;
  const yearCounts = query.yearFrom !== undefined || query.yearTo !== undefined ? 1 : 0;

  if (query.season && filters === 1 + yearCounts && (singleYear || !yearCounts)) {
    const season = m.labels.season[query.season] ?? query.season;
    return singleYear ? fmt(t.seasonYear, { season, year: singleYear }) : fmt(t.season, { season });
  }
  if (singleYear && filters === 1) return fmt(t.year, { year: singleYear });
  if (query.genres.length === 1 && filters === 1)
    return fmt(t.genre, { genre: m.labels.genre[query.genres[0]] ?? query.genres[0] });
  if (filters === 0) {
    if (query.sort === "trending") return t.trending;
    if (query.sort === "score") return t.top;
    if (query.sort === "newest") return t.newest;
  }
  return t.default;
}
