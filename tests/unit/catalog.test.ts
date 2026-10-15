import { describe, expect, it } from "vitest";
import { catalogHref, countFilters, parseCatalogParams } from "@/lib/catalog";
import { rankByRelevance } from "@/lib/search";

/** Стан каталогу в адресі: що записали — те й прочитали. */
const params = (href: string) => new URLSearchParams(href.split("?")[1] ?? "");

describe("фільтри каталогу в адресі", () => {
  it("усі фільтри переживають запис і читання", () => {
    const query = parseCatalogParams(
      params("/catalog?q=titan&genres=action,slice-of-life&genres_not=romance&tags=Isekai&year=2010-2020&season=fall&format=tv,movie&status=finished&episodes=13-26&score=8&country=jp&source=manga&sort=score&page=2"),
    );
    expect(parseCatalogParams(params(catalogHref(query)))).toEqual(query);
    expect(query).toMatchObject({
      q: "titan",
      genres: ["Action", "Slice of Life"],
      genresNot: ["Romance"],
      tags: ["Isekai"],
      yearFrom: 2010,
      yearTo: 2020,
      season: "FALL",
      formats: ["TV", "MOVIE"],
      statuses: ["FINISHED"],
      episodes: { min: 13, max: 26 },
      minScore: 8,
      country: "JP",
      source: "MANGA",
      sort: "score",
      page: 2,
    });
    expect(countFilters(query)).toBe(13);
  });

  it("без фільтрів — просто /catalog; пошук сортує за збігом", () => {
    expect(catalogHref({})).toBe("/catalog");
    expect(parseCatalogParams(params("/catalog?q=naruto")).sort).toBe("relevance");
    expect(parseCatalogParams(params("/catalog")).sort).toBe("popular");
  });

  it("сміття в адресі не ламає сторінку", () => {
    const query = parseCatalogParams(params("/catalog?genres=nope&year=abc&page=-5&score=99&sort=hack"));
    expect(query.genres).toEqual([]);
    expect(query.page).toBe(1);
    expect(query.yearFrom).toBeUndefined();
  });

  it("жанр і в «включити», і в «виключити» — лишається тільки «включити»", () => {
    expect(parseCatalogParams(params("/catalog?genres=action&genres_not=action")).genresNot).toEqual([]);
  });
});

describe("пошук за назвою", () => {
  it("точний збіг вище за популярніший частковий", () => {
    const items = [
      { id: 1, title: { romaji: "Naruto Shippuden", english: "Naruto: Shippuden" }, synonyms: [], popularity: 900000 },
      { id: 2, title: { romaji: "Naruto", english: "Naruto" }, synonyms: [], popularity: 800000 },
    ];
    expect(rankByRelevance("naruto", items)[0].id).toBe(2);
  });
});
