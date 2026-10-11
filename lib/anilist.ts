import { cacheLife } from "next/cache";

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

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.errors) {
    const error = json?.errors?.[0];
    throw new AniListError(error?.status ?? res.status, error?.message ?? res.statusText);
  }
  return json.data as T;
}

export type MediaSort = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC";

export type CatalogQuery = {
  sort: MediaSort;
  season?: Season;
  year?: number;
  page: number;
};

export type CatalogPage = {
  media: MediaCard[];
  currentPage: number;
  hasNextPage: boolean;
};

const CATALOG_QUERY = `
  query Catalog($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $year: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage }
      media(type: ANIME, isAdult: false, sort: $sort, season: $season, seasonYear: $year) { ${CARD_FIELDS} }
    }
  }
`;

export async function getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  "use cache";
  cacheLife("hours");

  const data = await anilist<{
    Page: { pageInfo: { currentPage: number; hasNextPage: boolean }; media: MediaCard[] };
  }>(CATALOG_QUERY, {
    page: query.page,
    perPage: 30,
    sort: [query.sort, "ID"],
    season: query.season,
    year: query.year,
  });

  return {
    media: data.Page.media,
    currentPage: data.Page.pageInfo.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
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

export type MediaDetails = MediaCard & {
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

export type WatchOrderItem = MediaCard & { startDate: FuzzyDate };

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
