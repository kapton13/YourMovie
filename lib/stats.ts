import type { ListStatus } from "./lists";

/**
 * Статистика профілю (етап 4): усе рахується з записів списку, відміток серій і даних AniList.
 * Файл спільний — рахує браузер і для свого профілю, і для відкритого чужого.
 */

export type StatsEntry = { media_id: number; status: ListStatus; score: number | null };
export type StatsMark = { media_id: number; episode: number; watched: boolean; updated_at: string };
export type StatsMedia = { id: number; duration: number | null; genres: string[] };

export type GenreStat = { genre: string; count: number; average: number | null };
export type MonthStat = { key: string; date: Date; episodes: number };

export type ProfileStats = {
  byStatus: Record<ListStatus, number>;
  episodes: number;
  /** Хвилини перегляду (лише серії, для яких AniList знає тривалість). */
  minutes: number;
  /** Скільки аніме з оцінкою 1, 2, …, 10 (дробові — до найближчої). */
  scores: number[];
  averageScore: number | null;
  genres: GenreStat[];
  /** Останні 12 місяців, від найдавнішого. */
  months: MonthStat[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeStats(
  entries: StatsEntry[],
  marks: StatsMark[],
  media: Map<number, StatsMedia>,
  now: Date,
): ProfileStats {
  const byStatus: Record<ListStatus, number> = { watching: 0, planning: 0, completed: 0, paused: 0, dropped: 0 };
  for (const e of entries) byStatus[e.status]++;

  const watched = marks.filter((m) => m.watched);
  let minutes = 0;
  for (const m of watched) minutes += media.get(m.media_id)?.duration ?? 0;

  const scores = Array.from({ length: 10 }, () => 0);
  const scored = entries.filter((e) => e.score !== null).map((e) => Number(e.score));
  for (const s of scored) scores[Math.min(10, Math.max(1, Math.round(s))) - 1]++;
  const averageScore = scored.length ? round1(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

  // Жанри — за аніме, які людина дивиться чи подивилася («Планую» — ще не смак).
  const genreMap = new Map<string, { count: number; sum: number; rated: number }>();
  for (const e of entries) {
    if (e.status === "planning") continue;
    for (const g of media.get(e.media_id)?.genres ?? []) {
      const item = genreMap.get(g) ?? { count: 0, sum: 0, rated: 0 };
      item.count++;
      if (e.score !== null) {
        item.sum += Number(e.score);
        item.rated++;
      }
      genreMap.set(g, item);
    }
  }
  const genres = [...genreMap]
    .map(([genre, g]) => ({ genre, count: g.count, average: g.rated ? round1(g.sum / g.rated) : null }))
    .sort((a, b) => b.count - a.count || (b.average ?? 0) - (a.average ?? 0) || a.genre.localeCompare(b.genre));

  // Серії по місяцях: дата відмітки (якщо відмічено цілий сезон — усі серії потрапляють в один день).
  const months: MonthStat[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${date.getFullYear()}-${date.getMonth()}`, date, episodes: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const m of watched) {
    const d = new Date(m.updated_at);
    const month = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (month) month.episodes++;
  }

  return { byStatus, episodes: watched.length, minutes, scores, averageScore, genres, months };
}
