import type { ListEntry, ListStatus } from "./lists";

/**
 * Правила для аніме з кількома частинами (сезони, фільми, OVA).
 * Статус і оцінка — на все аніме (запис під `key`), відмітки й оцінки серій — у кожній частині,
 * оцінка сезону — у кожній частині окремо.
 */

export type Mark = { watched: boolean; score: number | null };
export type Marks = Map<number, Mark>;
export type PartInfo = { id: number; episodes: number | null; status: string | null };

const STATUS_PRIORITY: ListStatus[] = ["watching", "paused", "planning", "completed", "dropped"];

/** Якщо сезони одного аніме раніше мали різні статуси — який узяти для всього аніме. */
export function mergeStatuses(statuses: ListStatus[]): ListStatus {
  return STATUS_PRIORITY.find((s) => statuses.includes(s)) ?? "planning";
}

function watchedCount(marks: Marks | undefined): number {
  let n = 0;
  if (marks) for (const [, m] of marks) if (m.watched) n++;
  return n;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Середнє оцінок серій частини, якщо оцінено всі її серії. */
export function seasonAverage(part: PartInfo, marks: Marks | undefined): number | null {
  if (!part.episodes || !marks) return null;
  const scores: number[] = [];
  for (let n = 1; n <= part.episodes; n++) {
    const s = marks.get(n)?.score;
    if (!s) return null;
    scores.push(s);
  }
  return round1(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Після змін у серіях або оцінках сезонів:
 * — є переглянуті серії, а аніме ще не в списку або «Планую» → «Дивлюся»;
 * — усі основні частини вийшли повністю й переглянуті → «Переглянуто»;
 * — оцінено всі основні частини → оцінка аніме = середнє оцінок сезонів.
 * Повертає той самий `entry`, якщо змінювати нічого не треба.
 */
export function franchiseEntryAfter(args: {
  key: number;
  entry: ListEntry | null;
  main: PartInfo[];
  marks: Map<number, Marks>;
  seasonScores: Map<number, number>;
}): ListEntry | null {
  const { key, entry, main, marks, seasonScores } = args;
  let status: ListStatus | null = entry?.status ?? null;
  let score = entry?.score ?? null;

  let anyWatched = false;
  for (const [, partMarks] of marks) if (watchedCount(partMarks) > 0) anyWatched = true;
  if (anyWatched && (status === null || status === "planning")) status = "watching";

  const allDone =
    main.length > 0 &&
    main.every(
      (p) =>
        (p.status === "FINISHED" || p.status === "CANCELLED") &&
        p.episodes &&
        watchedCount(marks.get(p.id)) >= p.episodes,
    );
  if (allDone && (status === "watching" || status === "planning" || status === "paused")) status = "completed";

  if (main.length > 0 && main.every((p) => seasonScores.has(p.id)))
    score = round1(main.reduce((sum, p) => sum + seasonScores.get(p.id)!, 0) / main.length);

  if (status === null) return entry;
  if (entry && entry.status === status && entry.score === score) return entry;
  return { media_id: key, status, score, updated_at: new Date().toISOString() };
}
