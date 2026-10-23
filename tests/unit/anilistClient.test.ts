import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AniListError, anilist, resetAniListClient } from "@/lib/anilistClient";

/** Як сайт береже AniList: черга, однакові запити разом, пауза при збоях і ліміті. */

const ok = (data: unknown = { Media: { id: 1 } }, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ data }), { status: 200, headers: { "content-type": "application/json", ...headers } });
const error = (status: number, message = "error", headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ data: null, errors: [{ message, status }] }), { status, headers });

const fetchMock = vi.fn<typeof fetch>();
const query = (n: number) => anilist(`query Q${n} { Media(id: ${n}) { id } }`, { n });

beforeEach(() => {
  resetAniListClient();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("запити до AniList", () => {
  it("однакові запити одночасно — до AniList іде один", async () => {
    fetchMock.mockImplementation(async () => ok());
    const results = await Promise.all([query(1), query(1), query(1)]);
    expect(results).toEqual([{ Media: { id: 1 } }, { Media: { id: 1 } }, { Media: { id: 1 } }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("не більше 3 запитів одночасно — решта чекає в черзі", async () => {
    let now = 0;
    let max = 0;
    fetchMock.mockImplementation(async () => {
      max = Math.max(max, ++now);
      await new Promise((r) => setTimeout(r, 10));
      now--;
      return ok();
    });
    await Promise.all(Array.from({ length: 8 }, (_, i) => query(i)));
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(max).toBe(3);
  });

  it("AniList вимкнув API (403) — кілька хвилин більше не стукаємо", async () => {
    fetchMock.mockImplementation(async () => error(403, "The AniList API has been temporarily disabled"));
    await expect(query(1)).rejects.toMatchObject({ status: 403 });
    await expect(query(2)).rejects.toBeInstanceOf(AniListError);
    await expect(query(3)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ліміт вичерпано надовго (429, Retry-After 60) — не повторюємо й не стукаємо, доки не мине", async () => {
    fetchMock.mockImplementation(async () => error(429, "Too Many Requests", { "retry-after": "60" }));
    await expect(query(1)).rejects.toMatchObject({ status: 429 });
    await expect(query(2)).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("коротка пауза ліміту (Retry-After 1) — чекаємо й пробуємо ще раз", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(error(429, "Too Many Requests", { "retry-after": "1" })).mockResolvedValueOnce(ok());
    const result = query(1);
    await vi.advanceTimersByTimeAsync(1100);
    await expect(result).resolves.toEqual({ Media: { id: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("збій сервера AniList — одна повторна спроба; кілька збоїв поспіль — пауза", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => error(502, "Bad Gateway"));
    const first = query(1);
    const firstDone = expect(first).rejects.toMatchObject({ status: 502 });
    await vi.advanceTimersByTimeAsync(1500);
    await firstDone;
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const second = query(2);
    const secondDone = expect(second).rejects.toMatchObject({ status: 503 });
    await vi.advanceTimersByTimeAsync(1500);
    await secondDone;
    // Третій збій поспіль — далі не стукаємо: повторна спроба вже не йде до AniList.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(query(3)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("лишився останній запит у хвилині — наступний чекає поновлення ліміту", async () => {
    vi.useFakeTimers();
    const reset = Math.floor(Date.now() / 1000) + 3;
    fetchMock.mockResolvedValueOnce(ok({ a: 1 }, { "x-ratelimit-remaining": "1", "x-ratelimit-reset": String(reset) }));
    fetchMock.mockResolvedValueOnce(ok({ b: 2 }));
    await query(1);
    const next = query(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(next).resolves.toEqual({ b: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("самі не перевищуємо ліміт: зайвий запит за хвилину чекає місця, а не отримує відмову від AniList", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => ok({ a: 1 }, { "x-ratelimit-limit": "30" }));
    await Promise.all(Array.from({ length: 28 }, (_, i) => query(i)));
    expect(fetchMock).toHaveBeenCalledTimes(28);
    // Одразу після сплеску місце звільниться лише за хвилину — відмовляємо самі, AniList не чіпаємо.
    await expect(query(99)).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(28);
    // За 45 с — чекати лишилось 15 с: чекаємо й ідемо.
    await vi.advanceTimersByTimeAsync(45_000);
    const next = query(100);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(28);
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(next).resolves.toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(29);
  });

  it("AniList каже, що ліміт 90 на хвилину, — запас більший", async () => {
    fetchMock.mockImplementation(async () => ok({ a: 1 }, { "x-ratelimit-limit": "90" }));
    await query(0);
    await Promise.all(Array.from({ length: 60 }, (_, i) => query(i + 1)));
    expect(fetchMock).toHaveBeenCalledTimes(61);
  });
});
