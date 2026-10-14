import type { ListEntry, ListStatus } from "./lists";

/**
 * Правила для аніме з кількома частинами (сезони, фільми, OVA).
 * Статус і оцінка — на все аніме (запис під `key`), відмітки й оцінки серій — у кожній частині,
 * оцінка сезону — у кожній частині окремо.
 */

export type Mark = { watched: boolean; score: number | null };
export type Marks = Map<number, Mark>;
export type PartInfo = {
  id: number;
  episodes: number | null;
  status: string | null;
  /** Скільки серій уже вийшло, якщо відомо (для частин, що виходять). */
  aired?: number;
};

const STATUS_PRIORITY: ListStatus[] = ["watching", "paused", "planning", "completed", "dropped"];

/** Якщо сезони одного аніме раніше мали різні статуси — який узяти для всього аніме. */
export function mergeStatuses(statuses: ListStatus[]): ListStatus {
  return STATUS_PRIORITY.find((s) => statuses.includes(s)) ?? "planning";
}

/** Скільки серій частини точно вже вийшло. */
function airedOf(p: PartInfo): number {
  if (p.aired !== undefined) return p.aired;
  return p.status === "FINISHED" || p.status === "CANCELLED" ? (p.episodes ?? 0) : 0;
}

/** Є серія, що вже вийшла, але не відмічена переглянутою. */
export function hasUnwatchedAired(main: PartInfo[], marks: Map<number, Marks>): boolean {
  return main.some((p) => {
    const partMarks = marks.get(p.id);
    for (let n = 1; n <= airedOf(p); n++) if (!partMarks?.get(n)?.watched) return true;
    return false;
  });
}

function watchedCount(marks: Marks | undefined): number {
  let n = 0;
  if (marks) for (const [, m] of marks) if (m.watched) n++;
  return n;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Середнє оцінок серій частини, якщо оцінено всі її серії (тоді воно має перевагу над ручною оцінкою сезону). */
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

/** Середнє оцінок сезонів, якщо оцінено кожну основну частину (вручну чи через серії). */
export function animeAverage(main: PartInfo[], seasonScores: Map<number, number>): number | null {
  if (main.length === 0 || !main.every((p) => seasonScores.has(p.id))) return null;
  return round1(main.reduce((sum, p) => sum + seasonScores.get(p.id)!, 0) / main.length);
}

/**
 * Після змін у серіях або оцінках сезонів:
 * — є переглянуті серії, а аніме ще не в списку або «Планую» → «Дивлюся»;
 * — усі основні частини вийшли повністю й переглянуті → «Переглянуто» (лише так — оцінка «Переглянуто» не ставить);
 * — «Переглянуто», а є серія, що вже вийшла й не відмічена → «Дивлюся»;
 * — оцінено всі основні частини → оцінка аніме = середнє оцінок сезонів (має перевагу над ручною);
 * — сезон перестав бути оціненим, а оцінка аніме була саме тим середнім (`before`) → прибираємо її.
 * Повертає той самий `entry`, якщо змінювати нічого не треба.
 */
export function franchiseEntryAfter(args: {
  key: number;
  entry: ListEntry | null;
  main: PartInfo[];
  marks: Map<number, Marks>;
  seasonScores: Map<number, number>;
  /** Оцінки сезонів до зміни — щоб прибрати застаріле середнє. */
  before?: Map<number, number>;
}): ListEntry | null {
  const { key, entry, main, marks, seasonScores, before } = args;
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
  if (status === "completed" && !allDone && hasUnwatchedAired(main, marks)) status = "watching";

  const average = animeAverage(main, seasonScores);
  if (average !== null) score = average;
  else if (before && score !== null && score === animeAverage(main, before)) score = null;

  if (status === null) return entry;
  if (entry && entry.status === status && entry.score === score) return entry;
  return { media_id: key, status, score, updated_at: new Date().toISOString() };
}
