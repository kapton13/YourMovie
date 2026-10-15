import { describe, expect, it } from "vitest";
import {
  animeAverage,
  franchiseEntryAfter,
  hasUnwatchedAired,
  mergeStatuses,
  seasonAverage,
  type Marks,
  type PartInfo,
} from "@/lib/franchiseRules";
import type { ListEntry, ListStatus } from "@/lib/lists";

/** Правила статусів і оцінок, узгоджені з власником (CLAUDE.md, етап 2). */

const watched = (n: number, from = 1): Marks =>
  new Map(Array.from({ length: n }, (_, i) => [from + i, { watched: true, score: null }]));
const scored = (scores: number[]): Marks =>
  new Map(scores.map((s, i) => [i + 1, { watched: true, score: s }]));
const entry = (status: ListStatus, score: number | null = null): ListEntry => ({ media_id: 1, status, score, updated_at: "" });
const finished = (id: number, episodes: number): PartInfo => ({ id, episodes, status: "FINISHED" });
const airing = (id: number, episodes: number | null, aired?: number): PartInfo => ({ id, episodes, status: "RELEASING", aired });
const announced = (id: number): PartInfo => ({ id, episodes: null, status: "NOT_YET_RELEASED" });

function after(args: {
  entry: ListEntry | null;
  main: PartInfo[];
  marks?: [number, Marks][];
  seasonScores?: [number, number][];
  before?: [number, number][];
}) {
  return franchiseEntryAfter({
    key: 1,
    entry: args.entry,
    main: args.main,
    marks: new Map(args.marks ?? []),
    seasonScores: new Map(args.seasonScores ?? []),
    before: args.before ? new Map(args.before) : undefined,
  });
}

describe("статус аніме", () => {
  it("перша відмічена серія нового аніме → «Дивлюся»", () => {
    expect(after({ entry: null, main: [finished(1, 12)], marks: [[1, watched(1)]] })?.status).toBe("watching");
    expect(after({ entry: entry("planning"), main: [finished(1, 12)], marks: [[1, watched(1)]] })?.status).toBe("watching");
  });

  it("усі серії аніме, що вийшло, → «Переглянуто»; без однієї — «Дивлюся»", () => {
    expect(after({ entry: entry("watching"), main: [finished(1, 12)], marks: [[1, watched(12)]] })?.status).toBe("completed");
    expect(after({ entry: entry("watching"), main: [finished(1, 12)], marks: [[1, watched(11)]] })?.status).toBe("watching");
  });

  it("аніме ще виходить: відмічено всі серії, що вийшли → «Переглянуто» (рішення 2026-10-15)", () => {
    expect(after({ entry: entry("watching"), main: [airing(1, 12, 5)], marks: [[1, watched(5)]] })?.status).toBe("completed");
    expect(after({ entry: entry("watching"), main: [airing(1, 12, 5)], marks: [[1, watched(4)]] })?.status).toBe("watching");
  });

  it("вийшла нова серія → назад у «Дивлюся»", () => {
    expect(after({ entry: entry("completed"), main: [airing(1, 12, 6)], marks: [[1, watched(5)]] })?.status).toBe("watching");
    expect(hasUnwatchedAired([airing(1, 12, 6)], new Map([[1, watched(5)]]))).toBe(true);
  });

  it("невідомо, скільки серій вийшло, — не вгадуємо «Переглянуто»", () => {
    expect(after({ entry: entry("watching"), main: [airing(1, 12)], marks: [[1, watched(5)]] })?.status).toBe("watching");
  });

  it("усі сезони: сезон 2 лише анонсовано → «Переглянуто»; сезон 2 почав виходити → «Дивлюся»", () => {
    const marks: [number, Marks][] = [[1, watched(12)]];
    expect(after({ entry: entry("watching"), main: [finished(1, 12), announced(2)], marks })?.status).toBe("completed");
    expect(after({ entry: entry("completed"), main: [finished(1, 12), airing(2, 12, 1)], marks })?.status).toBe("watching");
  });

  it("сезон 1 переглянуто, сезон 2 вийшов і не переглянутий → «Дивлюся»", () => {
    const main = [finished(1, 12), finished(2, 12)];
    expect(after({ entry: entry("watching"), main, marks: [[1, watched(12)]] })?.status).toBe("watching");
    expect(after({ entry: entry("watching"), main, marks: [[1, watched(12)], [2, watched(12)]] })?.status).toBe("completed");
  });

  it("OVA та спешли не впливають (лише основні частини)", () => {
    // Додаткова частина 99 не входить у main — її невідмічені серії не заважають «Переглянуто».
    expect(after({ entry: entry("watching"), main: [finished(1, 12)], marks: [[1, watched(12)], [99, watched(1)]] })?.status).toBe(
      "completed",
    );
  });

  it("оцінка сама по собі не ставить «Переглянуто»", () => {
    const result = after({ entry: entry("watching", 9), main: [finished(1, 12)], marks: [[1, watched(3)]] });
    expect(result?.status).toBe("watching");
  });

  it("«Кинув» і «На паузі» не змінюються від неповних відміток; нічого не вийшло — нічого не міняємо", () => {
    expect(after({ entry: entry("dropped"), main: [airing(1, 12, 5)], marks: [[1, watched(5)]] })?.status).toBe("dropped");
    expect(after({ entry: entry("paused"), main: [finished(1, 12)], marks: [[1, watched(3)]] })?.status).toBe("paused");
    expect(after({ entry: entry("planning"), main: [announced(1)] })?.status).toBe("planning");
  });

  it("«На паузі», а переглянуто все → «Переглянуто»", () => {
    expect(after({ entry: entry("paused"), main: [finished(1, 12)], marks: [[1, watched(12)]] })?.status).toBe("completed");
  });

  it("сезони з різними статусами зливаються за пріоритетом", () => {
    expect(mergeStatuses(["completed", "watching"])).toBe("watching");
    expect(mergeStatuses(["planning", "dropped"])).toBe("planning");
    expect(mergeStatuses([])).toBe("planning");
  });
});

describe("оцінки", () => {
  it("оцінка сезону = середнє серій, лише коли оцінено всі серії", () => {
    expect(seasonAverage(finished(1, 3), scored([8, 9, 10]))).toBe(9);
    expect(seasonAverage(finished(1, 3), scored([8, 9]))).toBeNull();
    expect(seasonAverage(finished(1, 3), scored([7, 8, 8]))).toBe(7.7);
  });

  it("оцінка аніме = середнє сезонів, лише коли оцінено всі основні сезони", () => {
    const main = [finished(1, 12), finished(2, 12)];
    expect(animeAverage(main, new Map([[1, 8], [2, 9]]))).toBe(8.5);
    expect(animeAverage(main, new Map([[1, 8]]))).toBeNull();
  });

  it("середнє сезонів має перевагу над ручною оцінкою аніме", () => {
    const result = after({ entry: entry("watching", 5), main: [finished(1, 12), finished(2, 12)], seasonScores: [[1, 8], [2, 9]] });
    expect(result?.score).toBe(8.5);
  });

  it("сезон перестав бути оціненим — застаріле середнє прибираємо, ручну оцінку лишаємо", () => {
    const main = [finished(1, 12), finished(2, 12)];
    const stale = after({ entry: entry("watching", 8.5), main, seasonScores: [[1, 8]], before: [[1, 8], [2, 9]] });
    expect(stale?.score).toBeNull();
    const manual = after({ entry: entry("watching", 7), main, seasonScores: [[1, 8]], before: [[1, 8], [2, 9]] });
    expect(manual?.score).toBe(7);
  });

  it("нічого не змінилось — повертає той самий запис", () => {
    const e = entry("watching", 7);
    expect(after({ entry: e, main: [finished(1, 12)], marks: [[1, watched(3)]] })).toBe(e);
  });
});
