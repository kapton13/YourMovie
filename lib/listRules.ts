import type { ListEntry, ListStatus } from "./lists";

/**
 * Як має змінитися запис у списку після змін у серіях:
 * — є переглянуті серії, а аніме ще не в списку або «Планую» → «Дивлюся»;
 * — переглянуто всі серії завершеного аніме → «Переглянуто»;
 * — оцінено всі серії → оцінка аніме = середнє (до десятих).
 * Повертає той самий об'єк `base`, якщо змінювати нічого не треба.
 */
export function entryAfterMarks(
  base: ListEntry | null,
  marks: Map<number, { watched: boolean; score: number | null }>,
  media: { mediaId: number; total: number | null; finished: boolean },
): ListEntry | null {
  let watched = 0;
  for (const [, m] of marks) if (m.watched) watched++;
  let status: ListStatus | null = base?.status ?? null;
  let score = base?.score ?? null;

  if (watched > 0 && (status === null || status === "planning")) status = "watching";
  if (
    media.finished &&
    media.total &&
    watched >= media.total &&
    (status === "watching" || status === "planning" || status === "paused")
  )
    status = "completed";

  if (media.total) {
    const scores: number[] = [];
    for (let n = 1; n <= media.total; n++) {
      const s = marks.get(n)?.score;
      if (s) scores.push(s);
    }
    if (scores.length === media.total)
      score = Math.round((scores.reduce((a, b) => a + b, 0) / media.total) * 10) / 10;
  }

  if (status === null) return base;
  if (base && base.status === status && base.score === score) return base;
  return { media_id: media.mediaId, status, score, updated_at: new Date().toISOString() };
}
