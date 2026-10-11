import type { CatalogQuery, MediaSort, Season } from "./anilist";
import { SEASON_LABELS } from "./labels";

/** Короткі назви для адреси сторінки, напр. /catalog?sort=popular&season=fall&year=2026 */
const SORT_PARAMS: Record<string, MediaSort> = {
  trending: "TRENDING_DESC",
  popular: "POPULARITY_DESC",
  score: "SCORE_DESC",
};

const SEASON_PARAMS: Record<string, Season> = {
  winter: "WINTER",
  spring: "SPRING",
  summer: "SUMMER",
  fall: "FALL",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined, min: number, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const n = Number(value);
  return n >= min && n <= max ? n : undefined;
}

export function parseCatalogParams(params: SearchParams): CatalogQuery {
  return {
    sort: SORT_PARAMS[first(params.sort) ?? ""] ?? "POPULARITY_DESC",
    season: SEASON_PARAMS[first(params.season) ?? ""],
    year: toInt(first(params.year), 1940, 2100),
    page: toInt(first(params.page), 1, 500) ?? 1,
  };
}

export function catalogHref(query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  const sortKey = Object.keys(SORT_PARAMS).find((key) => SORT_PARAMS[key] === query.sort);
  if (sortKey && query.sort !== "POPULARITY_DESC") params.set("sort", sortKey);
  if (query.season) params.set("season", query.season.toLowerCase());
  if (query.year) params.set("year", String(query.year));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export function catalogTitle(query: CatalogQuery): string {
  if (query.season && query.year) return `Сезон: ${SEASON_LABELS[query.season]} ${query.year}`;
  if (query.year) return `Аніме ${query.year} року`;
  if (query.sort === "TRENDING_DESC") return "Зараз у тренді";
  if (query.sort === "SCORE_DESC") return "Топ рейтингу";
  return "Популярне за весь час";
}
