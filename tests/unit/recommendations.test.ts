import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecCard, RecSeed } from "@/lib/anilist";

// AniList підміняємо: перевіряємо, як рекомендації переживають його відмови.
const anilist = vi.hoisted(() => ({
  getRecSeeds: vi.fn(),
  getRecCards: vi.fn(),
  getHomeSections: vi.fn(),
  getFranchises: vi.fn(),
}));
vi.mock("@/lib/anilist", () => anilist);

const { buildRecommendations } = await import("@/lib/recommendations");

const card = (id: number, extra: Partial<RecCard> = {}): RecCard =>
  ({
    id,
    title: { romaji: `Anime ${id}`, english: null, native: null },
    coverImage: { large: null, extraLarge: null, color: null },
    format: "TV",
    seasonYear: 2020,
    startDate: { year: 2020, month: 1, day: 1 },
    episodes: 12,
    averageScore: 80,
    status: "FINISHED",
    popularity: 1000,
    genres: ["Action"],
    tags: [],
    isAdult: false,
    previous: null,
    ...extra,
  }) as RecCard;

const seed = (id: number, recs: number[]): RecSeed => ({
  id,
  titles: { romaji: `Seed ${id}` },
  genres: ["Action"],
  tags: [],
  recs: recs.map((r) => ({ rating: 100, media: card(r) })),
});

const cardsOf = (ids: number[]) => new Map(ids.map((id) => [id, card(id)]));
const popular = { trending: [card(900)], popular: [card(901)], top: [card(902)] };
const entries = [{ id: 1, status: "completed" as const, score: 9 }];

describe("рекомендації, коли AniList відмовляє", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    anilist.getFranchises.mockResolvedValue({});
  });

  it("усе гаразд — радимо схожі", async () => {
    anilist.getRecSeeds.mockResolvedValue([seed(1, [10, 11])]);
    anilist.getRecCards.mockImplementation(async (ids: number[]) => cardsOf(ids));
    anilist.getHomeSections.mockResolvedValue(popular);
    const { items, basedOn } = await buildRecommendations(entries, []);
    expect(items.slice(0, 2).map((i) => i.media.id).sort()).toEqual([10, 11]);
    expect(basedOn).toBe(1);
  });

  it("«схожі» не прийшли — показуємо популярне, а не помилку", async () => {
    anilist.getRecSeeds.mockRejectedValue(new Error("AniList: 429"));
    anilist.getRecCards.mockImplementation(async (ids: number[]) => cardsOf(ids));
    anilist.getHomeSections.mockResolvedValue(popular);
    const { items } = await buildRecommendations(entries, []);
    expect(items.map((i) => i.media.id)).toEqual([900, 901, 902]);
    expect(items.every((i) => i.reason.kind === "popular")).toBe(true);
  });

  it("не вдалося дійти до перших сезонів — радимо з того, що вже є", async () => {
    const sequel = { rating: 100, media: card(12, { previous: 11 }) };
    anilist.getRecSeeds.mockResolvedValue([{ ...seed(1, [10]), recs: [...seed(1, [10]).recs, sequel] }]);
    anilist.getRecCards.mockRejectedValue(new Error("AniList: 500"));
    anilist.getHomeSections.mockRejectedValue(new Error("AniList: 500"));
    const { items } = await buildRecommendations(entries, []);
    // Другий сезон без першого не радимо.
    expect(items.map((i) => i.media.id)).toEqual([10]);
  });

  it("популярне вже в списках чи сховане — не показуємо", async () => {
    anilist.getRecSeeds.mockRejectedValue(new Error("AniList: 429"));
    anilist.getRecCards.mockImplementation(async (ids: number[]) => cardsOf(ids));
    anilist.getHomeSections.mockResolvedValue(popular);
    const { items } = await buildRecommendations([{ id: 900, status: "watching", score: null }], [901]);
    expect(items.map((i) => i.media.id)).toEqual([902]);
  });

  it("AniList не відповідає зовсім — помилка (сторінка покаже «Спробувати ще раз»)", async () => {
    anilist.getRecSeeds.mockRejectedValue(new Error("AniList: 403"));
    anilist.getRecCards.mockRejectedValue(new Error("AniList: 403"));
    anilist.getHomeSections.mockRejectedValue(new Error("AniList: 403"));
    await expect(buildRecommendations(entries, [])).rejects.toThrow("AniList: 403");
  });
});

describe("рекомендації: що вже в списках, не радимо", () => {
  const franchise = (key: number, main: number[], extras: number[] = []) => ({
    key,
    main: main.map((id) => ({ id })),
    extras: extras.map((id) => ({ id })),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    anilist.getRecCards.mockImplementation(async (ids: number[]) => cardsOf(ids));
    anilist.getHomeSections.mockResolvedValue({ trending: [], popular: [], top: [] });
  });

  it("передісторія, що вийшла пізніше (Fate/Zero до Fate/stay night), — та сама історія, не радимо", async () => {
    // У списку — аніме 1 (ключ — найперша частина). Порада 50 — його передісторія: «попередньої» не має,
    // тож лише групування аніме знає, що це те саме аніме. 60 — інше аніме.
    anilist.getRecSeeds.mockResolvedValue([seed(1, [50, 60]), seed(2, [50, 60])]);
    anilist.getFranchises.mockResolvedValue({ 1: franchise(1, [1, 50], [55]), 2: franchise(2, [2]) });
    const { items } = await buildRecommendations(
      [entries[0], { id: 2, status: "completed", score: 8 }],
      [],
    );
    expect(items.map((i) => i.media.id)).toEqual([60]);
    expect(anilist.getFranchises).toHaveBeenCalledWith([1, 2], expect.any(Number));
  });

  it("«Планую» — не виключаємо (його можна радити)", async () => {
    anilist.getRecSeeds.mockResolvedValue([seed(1, [70])]);
    anilist.getFranchises.mockResolvedValue({ 1: franchise(1, [1]) });
    const { items } = await buildRecommendations([entries[0], { id: 70, status: "planning", score: null }], []);
    expect(items.map((i) => i.media.id)).toEqual([70]);
    expect(anilist.getFranchises).toHaveBeenCalledWith([1], expect.any(Number));
  });

  it("групування не прийшло — радимо як раніше, без помилки", async () => {
    anilist.getRecSeeds.mockResolvedValue([seed(1, [50, 60])]);
    anilist.getFranchises.mockRejectedValue(new Error("AniList: 429"));
    const { items } = await buildRecommendations(entries, []);
    expect(items.map((i) => i.media.id).sort()).toEqual([50, 60]);
  });
});
