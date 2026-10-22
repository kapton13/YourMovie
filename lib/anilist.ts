import { cacheLife } from "next/cache";
import type { Titles } from "./i18n/title";
import { AniListError, anilist } from "./anilistClient";
import { shared } from "./shared";
import { PAGE_SIZE, type CatalogQuery, type SortKey } from "./catalog";
import { rankByRelevance } from "./search";
import { searchTitleIndex } from "./titleIndex";

export { AniListError };

/*
 * Пам'ять сервера по кожному аніме окремо (на додачу до кешу сторінок): кеш Next запам'ятовує відповідь
 * на цілий набір id, а набори в людей різні, — тож без цієї пам'яті ті самі аніме перепитувались би
 * в AniList знову й знову.
 */
const MEMO_LIMIT = 20000;

/**
 * AniList не відповів, поки збирається сайт (`next build` на Vercel): не валимо збирання — інакше під час
 * збою AniList не вийде викласти навіть виправлення. Короткий кеш робить ці дані «дірою», яку сервер
 * заповнить уже під час роботи. На сервері помилка йде далі як звичайно (і кеш тримає старі дані).
 */
const BUILDING = process.env.NEXT_PHASE === "phase-production-build";
type BuildFailure = { buildFailure: string };

function failedDuringBuild(error: unknown): BuildFailure {
  if (!BUILDING) throw error;
  console.warn("AniList unavailable during build, deferring to runtime:", String(error));
  cacheLife("seconds");
  return { buildFailure: String(error) };
}

function unwrap<T extends object>(result: T | BuildFailure): T {
  if ("buildFailure" in result) throw new AniListError(503, result.buildFailure);
  return result;
}

/** Щоб пам'ять не росла без кінця: забуваємо застаріле, а якщо й того мало — усе. */
function prune(memo: Map<number, { at: number }>, ttl: number) {
  if (memo.size < MEMO_LIMIT) return;
  for (const [id, hit] of memo) if (Date.now() - hit.at >= ttl) memo.delete(id);
  if (memo.size >= MEMO_LIMIT) memo.clear();
}

function fresh<T extends { at: number }>(memo: Map<number, T>, id: number, ttl: number): T | undefined {
  const hit = memo.get(id);
  return hit && Date.now() - hit.at < ttl ? hit : undefined;
}

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
  /** russian — з Shikimori (для російської версії), якщо відома. */
  title: { romaji: string | null; english: string | null; native?: string | null; russian?: string | null };
  coverImage: { large: string | null; color: string | null };
  format: MediaFormat | null;
  seasonYear: number | null;
  startDate: { year: number | null };
  episodes: number | null;
  averageScore: number | null;
  /** Перша частина аніме, до якого належить картка (для сезону 3 — сезон 1), якщо відомо. */
  rootId?: number;
  /** Попередня частина (для сезону 3 — сезон 2, для спешлу — його аніме), якщо відомо. */
  parentId?: number;
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
  title { romaji english native }
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
        synonyms
        popularity
        relations { edges { relationType node { id type format startDate { year month day } } } }
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
  Page: {
    pageInfo: { currentPage: number; hasNextPage: boolean };
    media: (CatalogItem & { relations: { edges: RelationEdge[] } | null })[];
  };
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
    // Попередня частина (з того самого запиту): спешл чи новий сезон сховається разом з аніме «Не цікаво».
    media: media.map(({ relations, ...m }) => ({ ...m, parentId: previousPart(m, relations?.edges ?? []) ?? undefined })),
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
  return unwrap(await loadFilterOptions());
}

async function loadFilterOptions(): Promise<FilterOptions | BuildFailure> {
  "use cache";
  const maxYear = new Date().getFullYear() + 1;
  let data;
  try {
    data = await anilist<{
      MediaTagCollection: { name: string; category: string; isAdult: boolean }[];
    }>(`query { MediaTagCollection { name category isAdult } }`, {});
  } catch (error) {
    return failedDuringBuild(error);
  }
  cacheLife("days");

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
  return unwrap(await loadHomeSections());
}

async function loadHomeSections(): Promise<HomeSections | BuildFailure> {
  "use cache";
  const current = seasonOf(new Date());
  type PageData = { media: MediaCard[] };
  let data;
  try {
    data = await anilist<Record<"trending" | "seasonal" | "popular" | "top", PageData>>(
      HOME_QUERY,
      // З запасом: на головній ховаємо те, що людина вже має в списках, а показуємо по 12.
      { season: current.season, year: current.year, perPage: 24 },
    );
  } catch (error) {
    return failedDuringBuild(error);
  }
  cacheLife("hours");
  const all = [data.trending, data.seasonal, data.popular, data.top].flatMap((p) => p.media);
  const roots = await getRoots(all.map((m) => m.id)).catch((error) => {
    console.error(error);
    return {} as Record<number, number>;
  });
  const withRoot = (list: MediaCard[]) => list.map((m) => ({ ...m, rootId: roots[m.id] ?? m.id }));

  return {
    season: current,
    trending: withRoot(data.trending.media),
    seasonal: withRoot(data.seasonal.media),
    popular: withRoot(data.popular.media),
    top: withRoot(data.top.media),
  };
}

type RelationEdge = {
  relationType: RelationType;
  node: { id: number; type: string; format?: string | null; startDate?: FuzzyDate | null };
};

const PREVIOUS_FORMATS = new Set(["TV", "TV_SHORT", "ONA", "MOVIE"]);

/**
 * Попередня частина — щоб дійти до першого сезону:
 * — PREQUEL, якщо це серіал чи фільм і він вийшов не пізніше (бо AniList іноді називає «попередньою»
 *   OVA, що вийшла після першого сезону); з кількох — найраніший;
 * — PARENT — лише для OVA, фільмів, спешлів: серіал із PARENT — це спін-оф, окреме аніме;
 * — для фільму чи OVA, що вийшли пізніше за свою «наступну» частину-серіал, — той серіал.
 */
function previousPart(
  media: { format: string | null; startDate?: { year: number | null; month?: number | null; day?: number | null } | null },
  edges: RelationEdge[],
): number | null {
  const own = media.startDate ? dateKey(media.startDate) : Infinity;
  const prequels = edges
    .filter(
      (e) =>
        e.relationType === "PREQUEL" &&
        e.node.type === "ANIME" &&
        PREVIOUS_FORMATS.has(e.node.format ?? "") &&
        (!e.node.startDate?.year || own === Infinity || dateKey(e.node.startDate) <= own),
    )
    .sort((a, b) => dateKey(a.node.startDate ?? NO_DATE) - dateKey(b.node.startDate ?? NO_DATE) || a.node.id - b.node.id);
  if (prequels.length > 0) return prequels[0].node.id;
  if (SERIES_FORMATS.has(media.format ?? "")) return null;
  const parent = edges.find((e) => e.relationType === "PARENT" && e.node.type === "ANIME");
  if (parent) return parent.node.id;
  // Фільм-передісторія, що вийшов пізніше за серіал (JUJUTSU KAISEN 0 → «наступна» — серіал 2020 року):
  // перша частина — той серіал.
  const earlierSequel = edges.find(
    (e) =>
      e.relationType === "SEQUEL" &&
      e.node.type === "ANIME" &&
      SERIES_FORMATS.has(e.node.format ?? "") &&
      e.node.startDate?.year &&
      own !== Infinity &&
      dateKey(e.node.startDate) < own,
  );
  return earlierSequel?.node.id ?? null;
}

const NO_DATE: FuzzyDate = { year: null, month: null, day: null };

const ROOTS_QUERY = `
  query Roots($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        format
        startDate { year month day }
        relations { edges { relationType node { id type format startDate { year month day } } } }
      }
    }
  }
`;

/** «Попередня частина» кожного аніме — для `getRoots` з різних сторінок. */
const previousMemo = shared("previousMemo", () => new Map<number, { at: number; previous: number | null }>());

/**
 * Перша частина аніме для кожного id: ідемо назад по «попередня частина» (для OVA — до основного
 * аніме). Так сезон 3 на головній ховається, якщо в списку людини є це аніме (воно записане
 * під першою частиною). Кілька легких запитів на всі картки разом.
 */
export async function getRoots(ids: number[]): Promise<Record<number, number>> {
  return unwrap(await loadRoots(ids));
}

async function loadRoots(ids: number[]): Promise<Record<number, number> | BuildFailure> {
  "use cache";

  type Node = {
    id: number;
    format: string | null;
    startDate: FuzzyDate | null;
    relations: { edges: RelationEdge[] };
  };
  const previousOf = new Map<number, number | null>();
  const chains = new Map<number, number[]>([...new Set(ids)].map((id) => [id, [id]]));
  let walking = [...chains.keys()];
  for (let step = 0; step < 6 && walking.length > 0; step++) {
    for (const id of walking) {
      const last = chains.get(id)!.at(-1)!;
      const hit = fresh(previousMemo, last, FRANCHISE_TTL);
      if (hit) previousOf.set(last, hit.previous);
    }
    const unknown = [...new Set(walking.map((id) => chains.get(id)!.at(-1)!))].filter((id) => !previousOf.has(id));
    for (let i = 0; i < unknown.length; i += 50) {
      const chunk = unknown.slice(i, i + 50);
      let data;
      try {
        data = await anilist<{ Page: { media: Node[] } }>(ROOTS_QUERY, { ids: chunk });
      } catch (error) {
        return failedDuringBuild(error);
      }
      for (const id of chunk) previousOf.set(id, null);
      for (const m of data.Page.media) previousOf.set(m.id, previousPart(m, m.relations.edges));
      const at = Date.now();
      for (const id of chunk) previousMemo.set(id, { at, previous: previousOf.get(id)! });
    }
    const next: number[] = [];
    for (const id of walking) {
      const chain = chains.get(id)!;
      const previous = previousOf.get(chain.at(-1)!);
      if (previous && !chain.includes(previous)) {
        chain.push(previous);
        next.push(id);
      }
    }
    walking = next;
  }
  prune(previousMemo, FRANCHISE_TTL);
  cacheLife("days");
  return Object.fromEntries([...chains].map(([id, chain]) => [id, chain.at(-1)!]));
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
  title: { romaji: string | null; english: string | null; native: string | null; russian?: string | null };
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

/** Частина аніме: сезон, фільм, OVA… */
export type FranchisePart = WatchOrderItem & {
  status: MediaStatus | null;
  duration: number | null;
  /** Що це за частина — підпис («Сезон 2», «Фільм»…) складає `partLabel` потрібною мовою. */
  kind: PartKind;
  /** Номер сезону для основних серіалів (kind "season"). */
  season: number | null;
};

export type PartKind = "season" | "series" | "MOVIE" | "OVA" | "SPECIAL" | "MUSIC" | "other";

/**
 * Одне аніме з усіма частинами.
 * `key` — id найпершої основної частини: під ним зберігається статус і оцінка всього аніме.
 */
export type Franchise = {
  key: number;
  /** Англійська назва (для сортування); показувати — `animeTitle(titles, lang)`. */
  title: string;
  titles: Titles;
  /** Основна історія (ланцюжок «попередня / наступна частина») за датою виходу. */
  main: FranchisePart[];
  /** Побічні історії, спешли, OVA «збоку» — за датою виходу. */
  extras: FranchisePart[];
};

const FRANCHISE_QUERY = `
  query Franchise($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${CARD_FIELDS}
        status
        duration
        startDate { year month day }
        relations { edges { relationType node { id type format startDate { year month day } } } }
      }
    }
  }
`;

const FRANCHISE_LIMIT = 60;
const CHAIN_TYPES: RelationType[] = ["PREQUEL", "SEQUEL"];
// Що ще належить до того самого аніме. Спін-офи, інші версії, «ті ж герої» — окремі аніме.
const EXTRA_TYPES: RelationType[] = ["SIDE_STORY", "PARENT", "SUMMARY"];
const SERIES_FORMATS = new Set(["TV", "TV_SHORT", "ONA"]);
const PART_FORMAT_KINDS = new Set<PartKind>(["MOVIE", "OVA", "SPECIAL", "MUSIC"]);

function dateKey({ year, month, day }: { year: number | null; month?: number | null; day?: number | null }): number {
  return year == null ? Infinity : year * 10000 + (month ?? 12) * 100 + (day ?? 31);
}

function byDate(a: WatchOrderItem, b: WatchOrderItem): number {
  return dateKey(a.startDate) - dateKey(b.startDate) || a.id - b.id;
}

const FRANCHISE_TTL = 24 * 60 * 60 * 1000;
/** Аніме за id будь-якої його частини: сезон 2 після сезону 1 не обходить усе аніме наново. */
const franchiseMemo = shared("franchiseMemo", () => new Map<number, { at: number; franchise: Franchise }>());

/** Усі частини аніме, до якого належить `id`. */
export async function getFranchise(id: number): Promise<Franchise> {
  const hit = fresh(franchiseMemo, id, FRANCHISE_TTL);
  if (hit) return hit.franchise;
  const franchise = await loadFranchise(id);
  prune(franchiseMemo, FRANCHISE_TTL);
  const at = Date.now();
  for (const part of [...franchise.main, ...franchise.extras]) franchiseMemo.set(part.id, { at, franchise });
  franchiseMemo.set(id, { at, franchise });
  return franchise;
}

async function loadFranchise(id: number): Promise<Franchise> {
  "use cache";
  cacheLife("days");

  type Node = Omit<FranchisePart, "kind" | "season"> & {
    relations: { edges: { relationType: RelationType; node: { id: number; type: string } }[] };
  };

  const nodes = new Map<number, Node>();
  const queued = new Set([id]);
  let frontier = [id];
  while (frontier.length > 0 && nodes.size < FRANCHISE_LIMIT) {
    const data = await anilist<{ Page: { media: Node[] } }>(FRANCHISE_QUERY, { ids: frontier });
    const next: number[] = [];
    for (const media of data.Page.media) {
      nodes.set(media.id, media);
      for (const edge of media.relations.edges) {
        // Серіал із PARENT — це спін-оф (окреме аніме), а не OVA чи фільм до основного.
        const spinOff = edge.relationType === "PARENT" && SERIES_FORMATS.has(media.format ?? "");
        const follow = !spinOff && (CHAIN_TYPES.includes(edge.relationType) || EXTRA_TYPES.includes(edge.relationType));
        if (follow && edge.node.type === "ANIME" && !queued.has(edge.node.id)) {
          queued.add(edge.node.id);
          next.push(edge.node.id);
        }
      }
    }
    frontier = next.slice(0, FRANCHISE_LIMIT - nodes.size);
  }

  // Ланцюжки «попередня / наступна»; основний — той, де найбільше серіалів (далі — найбільше частин).
  const chainOf = new Map<number, number>();
  const chains: number[][] = [];
  for (const start of nodes.keys()) {
    if (chainOf.has(start)) continue;
    const chain: number[] = [];
    const stack = [start];
    chainOf.set(start, chains.length);
    while (stack.length) {
      const current = stack.pop()!;
      chain.push(current);
      for (const edge of nodes.get(current)!.relations.edges) {
        if (CHAIN_TYPES.includes(edge.relationType) && nodes.has(edge.node.id) && !chainOf.has(edge.node.id)) {
          chainOf.set(edge.node.id, chains.length);
          stack.push(edge.node.id);
        }
      }
    }
    chains.push(chain);
  }
  const weight = (chain: number[]) =>
    chain.filter((n) => SERIES_FORMATS.has(nodes.get(n)!.format ?? "")).length * 1000 + chain.length;
  // Рівні ланцюжки — найраніший, потім найменший id: результат не залежить від того, з якої частини почали.
  const earliest = (chain: number[]) => Math.min(...chain.map((n) => dateKey(nodes.get(n)!.startDate)));
  const better = (a: number[], b: number[]) =>
    weight(a) - weight(b) || earliest(b) - earliest(a) || Math.min(...b) - Math.min(...a);
  const mainChain = new Set(chains.reduce((best, c) => (better(c, best) > 0 ? c : best), chains[0] ?? [id]));

  const strip = (node: Node): Omit<FranchisePart, "kind" | "season"> => {
    const part: Partial<Node> = { ...node };
    delete part.relations;
    return part as Omit<FranchisePart, "kind" | "season">;
  };
  const main = [...nodes.values()].filter((n) => mainChain.has(n.id)).map(strip).sort(byDate);
  const extras = [...nodes.values()].filter((n) => !mainChain.has(n.id)).map(strip).sort(byDate);

  let seasonNumber = 0;
  const describe = (part: Omit<FranchisePart, "kind" | "season">, inMain: boolean): Pick<FranchisePart, "kind" | "season"> => {
    if (SERIES_FORMATS.has(part.format ?? "")) return inMain ? { kind: "season", season: ++seasonNumber } : { kind: "series", season: null };
    const format = part.format as PartKind | null;
    return { kind: format && PART_FORMAT_KINDS.has(format) ? format : "other", season: null };
  };
  const mainParts = main.map((p) => ({ ...p, ...describe(p, true) }));
  const extraParts = extras.map((p) => ({ ...p, ...describe(p, false) }));
  const first = mainParts[0] ?? extraParts[0];
  // AniList такого id не знає (видалено чи об'єднано з іншим).
  if (!first) throw new AniListError(404, `media ${id} not found`);

  return {
    key: first.id,
    // Порожня назва — інтерфейс покаже «Без назви» потрібною мовою.
    title: first.title.english ?? first.title.romaji ?? "",
    titles: first.title,
    main: mainParts,
    extras: extraParts,
  };
}

/**
 * Усі частини основної історії, упорядковані за датою виходу.
 * Якщо частина одна — порожній список.
 */
export async function getWatchOrder(id: number): Promise<FranchisePart[]> {
  const franchise = await getFranchise(id);
  return franchise.main.length > 1 ? franchise.main : [];
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
  genres: string[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  /** Скільки серій уже вийшло. */
  airedCount: number;
  /** Коли вийшла остання серія (Unix, секунди), якщо відомо. */
  lastAiredAt: number | null;
  /** Останні серії, що вийшли: [номер, час виходу]. */
  recentAirings: [number, number][];
};

const MY_MEDIA_QUERY = `
  query MyMedia($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${CARD_FIELDS}
        status
        duration
        genres
        nextAiringEpisode { episode airingAt }
      }
    }
    recent: Page(perPage: 50) {
      airingSchedules(mediaId_in: $ids, notYetAired: false, sort: TIME_DESC) { mediaId episode airingAt }
    }
  }
`;

/** До 50 тайтлів за раз (ліміт AniList). */
async function getMyMediaChunk(ids: number[]): Promise<MyMedia[]> {
  type Response = {
    Page: { media: (MediaCard & Pick<MyMedia, "status" | "duration" | "genres" | "nextAiringEpisode">)[] };
    recent: { airingSchedules: { mediaId: number; episode: number; airingAt: number }[] };
  };
  const data = await anilist<Response>(MY_MEDIA_QUERY, { ids });
  const lastAired = new Map<number, number>();
  const airings = new Map<number, [number, number][]>();
  for (const s of data.recent.airingSchedules) {
    if (!lastAired.has(s.mediaId)) lastAired.set(s.mediaId, s.airingAt);
    airings.set(s.mediaId, [...(airings.get(s.mediaId) ?? []), [s.episode, s.airingAt]]);
  }

  return data.Page.media.map((m) => ({
    ...m,
    airedCount: airedEpisodeCount(m),
    lastAiredAt: lastAired.get(m.id) ?? null,
    recentAirings: airings.get(m.id) ?? [],
  }));
}

/** Серії виходять щотижня, тож кілька хвилин — достатньо свіжо. */
const MY_MEDIA_TTL = 5 * 60 * 1000;
const myMediaMemo = shared("myMediaMemo", () => new Map<number, { at: number; media: MyMedia | null }>());

/** Дані для «Моїх аніме», профілю й лічильника нових серій; перепитуємо лише те, чого немає в пам'яті. */
export async function getMyMedia(ids: number[]): Promise<MyMedia[]> {
  const unique = [...new Set(ids)];
  const missing = unique.filter((id) => !fresh(myMediaMemo, id, MY_MEDIA_TTL)).sort((a, b) => a - b);
  const loaded = new Map<number, MyMedia | null>();
  const chunks: number[][] = [];
  for (let i = 0; i < missing.length; i += 50) chunks.push(missing.slice(i, i + 50));
  await Promise.all(
    chunks.map(async (chunk) => {
      const media = await getMyMediaChunk(chunk);
      const at = Date.now();
      for (const id of chunk) loaded.set(id, null);
      for (const m of media) loaded.set(m.id, m);
      for (const id of chunk) myMediaMemo.set(id, { at, media: loaded.get(id)! });
    }),
  );
  prune(myMediaMemo, MY_MEDIA_TTL);
  return unique
    .map((id) => (loaded.has(id) ? loaded.get(id) : myMediaMemo.get(id)?.media) ?? null)
    .filter((m): m is MyMedia => m !== null);
}

/** Кілька аніме за id їхніх частин; частини одного аніме не рахуються двічі. */
export async function getFranchises(ids: number[], budgetMs = 8000): Promise<Record<number, Franchise>> {
  const result: Record<number, Franchise> = {};
  const started = Date.now();
  for (const id of ids) {
    if (result[id]) continue;
    // Довгий список уперше: віддаємо те, що встигли (решта — наступного разу, вже з кешу). Велике аніме
    // (сотні частин) може саме перевищити час — не чекаємо його, воно дозбирається у фоні й ляже в кеш.
    const left = budgetMs - (Date.now() - started);
    if (left <= 0) break;
    try {
      const loading = getFranchise(id);
      loading.catch(() => {});
      let timer: ReturnType<typeof setTimeout> | undefined;
      const franchise = await Promise.race([loading, new Promise<null>((r) => (timer = setTimeout(() => r(null), left)))]);
      clearTimeout(timer);
      if (!franchise) break;
      for (const part of [...franchise.main, ...franchise.extras]) result[part.id] = franchise;
      result[id] = franchise;
    } catch (error) {
      console.error(error);
      // Ліміт запитів AniList — далі теж не вийде; невідомий id — просто пропускаємо.
      if (error instanceof AniListError && error.status === 429) break;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Рекомендації: «схожі» від глядачів AniList для аніме користувача

export type RecTag = { name: string; rank: number };

export type RecCard = MediaCard & {
  status: MediaStatus | null;
  popularity: number | null;
  genres: string[];
  tags: RecTag[];
  isAdult: boolean;
  /** Попередня частина (PREQUEL або PARENT), щоб радити аніме з першого сезону. */
  previous: number | null;
};

export type RecSeed = {
  id: number;
  titles: Titles;
  genres: string[];
  tags: RecTag[];
  recs: { rating: number; media: RecCard }[];
};

const REC_CARD_FIELDS = `
  ${CARD_FIELDS}
  status
  popularity
  genres
  isAdult
  tags { name rank }
  relations { edges { relationType node { id type format startDate { year month day } } } }
`;

const REC_SEEDS_QUERY = `
  query RecSeeds($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        title { romaji english native }
        genres
        tags { name rank }
        recommendations(sort: RATING_DESC, perPage: 20) {
          nodes { rating mediaRecommendation { ${REC_CARD_FIELDS} } }
        }
      }
    }
  }
`;

const REC_CARDS_QUERY = `
  query RecCards($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) { ${REC_CARD_FIELDS} }
    }
  }
`;

type RawRecCard = Omit<RecCard, "previous" | "tags"> & {
  tags: RecTag[] | null;
  relations: { edges: RelationEdge[] } | null;
};

function toRecCard(raw: RawRecCard): RecCard {
  const { relations, ...card } = raw;
  return { ...card, tags: raw.tags ?? [], previous: previousPart(raw, relations?.edges ?? []) };
}

/**
 * Пам'ять сервера на кілька годин: «схожі» змінюються повільно, а в кожного користувача свій набір
 * аніме — тож пам'ятаємо кожне аніме окремо й догружаємо лише те, чого бракує.
 */
const REC_TTL = 6 * 60 * 60 * 1000;
const seedMemo = shared("seedMemo", () => new Map<number, { at: number; seed: RecSeed | null }>());
const cardMemo = shared("cardMemo", () => new Map<number, { at: number; card: RecCard | null }>());


/**
 * Частинами й паралельно. Невдала частина не валить решту: рекомендації краще показати з того,
 * що вдалося зібрати (AniList іноді відмовляє серверам Vercel). Усе не вдалося — помилка.
 */
async function inChunks(ids: number[], size: number, load: (chunk: number[]) => Promise<void>) {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));
  const results = await Promise.allSettled(chunks.map(load));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length === 0) return;
  console.error(`AniList: ${failed.length} of ${chunks.length} chunks failed`, failed[0].reason);
  if (failed.length === chunks.length) throw failed[0].reason;
}

/** «Схожі» для аніме користувача (по 25 за запит — так відповідь AniList не надто велика). */
export async function getRecSeeds(ids: number[]): Promise<RecSeed[]> {
  prune(seedMemo, REC_TTL);
  prune(cardMemo, REC_TTL);
  // Збираємо результат тут, а не з пам'яті: інший запит може її тим часом почистити.
  const found = new Map<number, RecSeed | null>();
  for (const id of new Set(ids)) {
    const hit = fresh(seedMemo, id, REC_TTL);
    if (hit) found.set(id, hit.seed);
  }
  const missing = [...new Set(ids)].filter((id) => !found.has(id));
  await inChunks(missing, 25, async (chunk) => {
    type Raw = {
      id: number;
      title: { romaji: string | null; english: string | null; native: string | null };
      genres: string[];
      tags: RecTag[] | null;
      recommendations: { nodes: { rating: number; mediaRecommendation: RawRecCard | null }[] };
    };
    const data = await anilist<{ Page: { media: Raw[] } }>(REC_SEEDS_QUERY, { ids: chunk });
    const at = Date.now();
    for (const id of chunk) {
      seedMemo.set(id, { at, seed: null });
      found.set(id, null);
    }
    for (const m of data.Page.media) {
      const recs = m.recommendations.nodes
        .filter((n) => n.mediaRecommendation)
        .map((n) => ({ rating: n.rating, media: toRecCard(n.mediaRecommendation!) }));
      for (const r of recs) cardMemo.set(r.media.id, { at, card: r.media });
      const seed: RecSeed = {
        id: m.id,
        titles: m.title,
        genres: m.genres,
        tags: m.tags ?? [],
        recs,
      };
      seedMemo.set(m.id, { at, seed });
      found.set(m.id, seed);
    }
  });
  return ids.map((id) => found.get(id)).filter((s): s is RecSeed => Boolean(s));
}

/** Картки аніме для рекомендацій (щоб дійти до першого сезону). */
export async function getRecCards(ids: number[]): Promise<Map<number, RecCard>> {
  prune(cardMemo, REC_TTL);
  const result = new Map<number, RecCard>();
  const missing: number[] = [];
  for (const id of new Set(ids)) {
    const hit = fresh(cardMemo, id, REC_TTL);
    if (!hit) missing.push(id);
    else if (hit.card) result.set(id, hit.card);
  }
  await inChunks(missing, 50, async (chunk) => {
    const data = await anilist<{ Page: { media: RawRecCard[] } }>(REC_CARDS_QUERY, { ids: chunk });
    const at = Date.now();
    for (const id of chunk) cardMemo.set(id, { at, card: null });
    for (const m of data.Page.media) {
      const card = toRecCard(m);
      cardMemo.set(m.id, { at, card });
      result.set(m.id, card);
    }
  });
  return result;
}
