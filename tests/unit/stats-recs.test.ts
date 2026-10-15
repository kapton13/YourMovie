import { describe, expect, it } from "vitest";
import { seedWeight } from "@/lib/recommendations";
import { computeStats, type StatsEntry, type StatsMark, type StatsMedia } from "@/lib/stats";

describe("статистика профілю", () => {
  const now = new Date(2026, 9, 15);
  const entries: StatsEntry[] = [
    { media_id: 1, status: "completed", score: 9 },
    { media_id: 2, status: "watching", score: 7.4 },
    { media_id: 3, status: "planning", score: null },
    { media_id: 4, status: "dropped", score: 3 },
  ];
  const marks: StatsMark[] = [
    { media_id: 1, episode: 1, watched: true, updated_at: "2026-10-01T10:00:00Z" },
    { media_id: 1, episode: 2, watched: true, updated_at: "2026-09-10T10:00:00Z" },
    { media_id: 2, episode: 1, watched: false, updated_at: "2026-10-02T10:00:00Z" },
    { media_id: 9, episode: 1, watched: true, updated_at: "2020-01-01T10:00:00Z" },
  ];
  const media = new Map<number, StatsMedia>([
    [1, { id: 1, duration: 24, genres: ["Action", "Drama"] }],
    [2, { id: 2, duration: null, genres: ["Action"] }],
    [3, { id: 3, duration: 24, genres: ["Comedy"] }],
  ]);
  const stats = computeStats(entries, marks, media, now);

  it("рахує статуси, переглянуті серії й хвилини", () => {
    expect(stats.byStatus).toEqual({ watching: 1, planning: 1, completed: 1, paused: 0, dropped: 1 });
    expect(stats.episodes).toBe(3); // невідмічені не рахуються
    expect(stats.minutes).toBe(48); // тривалість відома лише для аніме 1
  });

  it("оцінки: розподіл 1–10 і середня", () => {
    expect(stats.scores[8]).toBe(1); // 9
    expect(stats.scores[6]).toBe(1); // 7.4 → 7
    expect(stats.scores[2]).toBe(1); // 3
    expect(stats.averageScore).toBe(6.5);
  });

  it("жанри — без «Планую»; місяці — останні 12, від найдавнішого", () => {
    expect(stats.genres.map((g) => g.genre)).toEqual(["Action", "Drama"]);
    expect(stats.genres[0]).toMatchObject({ count: 2, average: 8.2 });
    expect(stats.months).toHaveLength(12);
    expect(stats.months.at(-1)!.episodes).toBe(1); // жовтень
    expect(stats.months.at(-2)!.episodes).toBe(1); // вересень
  });
});

describe("рекомендації: вага аніме зі списку", () => {
  it("високі оцінки сильно «за», низькі — «проти», «Планую» — нейтрально", () => {
    expect(seedWeight("completed", 10)).toBeGreaterThan(seedWeight("completed", 7));
    expect(seedWeight("completed", 3)).toBeLessThan(0);
    expect(seedWeight("planning", 10)).toBe(0);
  });

  it("«Дивлюся» важить трохи більше, «Кинув» — м'яко «проти»", () => {
    expect(seedWeight("watching", 8)).toBeGreaterThan(seedWeight("completed", 8));
    expect(seedWeight("watching", null)).toBeGreaterThan(seedWeight("completed", null));
    expect(seedWeight("dropped", null)).toBeLessThan(0);
    expect(seedWeight("dropped", 10)).toBeLessThan(0);
  });
});
