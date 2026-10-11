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

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.errors) {
    const message = json?.errors?.[0]?.message ?? res.statusText;
    throw new Error(`AniList: ${res.status} ${message}`);
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
