import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Наша копія даних AniList (`anime_store`): коли бере її сайт і що буде, якщо таблиці немає. */

const client = vi.hoisted(() => ({ anilist: vi.fn() }));
vi.mock("@/lib/anilistClient", () => ({
  anilist: client.anilist,
  AniListError: class AniListError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));
// Кеш Next поза сайтом не працює — тут він не потрібен.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));
const { getFranchise, getMyMedia } = await import("@/lib/anilist");
const { resetAnimeStore } = await import("@/lib/animeStore");
const { AniListError } = await import("@/lib/anilistClient");

const DAY = 24 * 60 * 60 * 1000;
type Row = { kind: string; id: number; data: unknown; updated_at: string };
let rows: Row[] = [];
let storeDown = false;
const storeFetch = vi.fn(async (url: string) => {
  if (storeDown) return new Response(JSON.stringify({ code: "PGRST205" }), { status: 404 });
  const u = new URL(url);
  const kind = u.searchParams.get("kind")!.replace("eq.", "");
  const ids = u.searchParams.get("id")!.replace(/^in\.\(|\)$/g, "").split(",").map(Number);
  return Response.json(rows.filter((r) => r.kind === kind && ids.includes(r.id)));
});

const part = (id: number) => ({ id, title: { romaji: `Anime ${id}`, english: null }, format: "TV" });
const franchise = (key: number, parts: number[]) => ({ key, title: `Anime ${key}`, titles: {}, main: parts.map(part), extras: [] });
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
function store(key: number, parts: number[], age: number) {
  rows.push({ kind: "franchise", id: key, data: franchise(key, parts), updated_at: ago(age) });
  for (const id of parts) rows.push({ kind: "part", id, data: { key }, updated_at: ago(age) });
}

let nextId = 1000;
beforeEach(() => {
  rows = [];
  storeDown = false;
  resetAnimeStore();
  client.anilist.mockReset();
  storeFetch.mockClear();
  vi.stubGlobal("fetch", storeFetch);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

// Кожен випадок — свої id: пам'ять сервера спільна на процес.
const fresh = () => (nextId += 10);

describe("групування аніме з нашої копії", () => {
  it("свіже (робот оновив цього тижня) — без запитів до AniList, за будь-якою частиною", async () => {
    const key = fresh();
    store(key, [key, key + 1, key + 2], DAY);
    const f = await getFranchise(key + 2);
    expect(f.key).toBe(key);
    expect(client.anilist).not.toHaveBeenCalled();
  });

  it("давнє — питаємо AniList; AniList не відповідає — віддаємо давнє", async () => {
    const key = fresh();
    store(key, [key, key + 1], 30 * DAY);
    client.anilist.mockRejectedValue(new AniListError(403, "disabled"));
    const f = await getFranchise(key + 1);
    expect(f.key).toBe(key);
    expect(client.anilist).toHaveBeenCalled();
  });

  it("таблиці ще немає — працюємо лише з AniList, і кілька хвилин базу не питаємо", async () => {
    storeDown = true;
    const key = fresh();
    client.anilist.mockImplementation(async () => ({
      Page: {
        media: [{ ...part(key), startDate: { year: 2020 }, relations: { edges: [] } }],
      },
    }));
    expect((await getFranchise(key)).key).toBe(key);
    const calls = storeFetch.mock.calls.length;
    await getFranchise(fresh()).catch(() => {});
    expect(storeFetch.mock.calls.length).toBe(calls);
  });
});

describe("«Мої аніме» з нашої копії", () => {
  it("AniList не відповідає — картки з копії, а серія, що вже вийшла за розкладом, рахується вийшлою", async () => {
    const id = fresh();
    const airedAt = Math.floor((Date.now() - DAY) / 1000);
    rows.push({
      kind: "media",
      id,
      data: { ...part(id), airedCount: 3, lastAiredAt: airedAt - 7 * 86400, recentAirings: [], nextAiringEpisode: { episode: 4, airingAt: airedAt } },
      updated_at: ago(2 * DAY),
    });
    client.anilist.mockRejectedValue(new AniListError(403, "disabled"));
    const [media] = await getMyMedia([id]);
    expect(media.airedCount).toBe(4);
    expect(media.nextAiringEpisode).toBeNull();
    expect(media.lastAiredAt).toBe(airedAt);
  });

  it("AniList не відповідає, а в копії нічого — помилка, як і раніше", async () => {
    client.anilist.mockRejectedValue(new AniListError(403, "disabled"));
    await expect(getMyMedia([fresh()])).rejects.toBeInstanceOf(AniListError);
  });
});
