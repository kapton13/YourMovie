/**
 * Назви жанрів, форматів, сезонів тощо тепер у словниках мов (`messages/<мова>/labels.ts`),
 * дати — у `lib/i18n/labels.ts`. Тут лишилося те, що від мови не залежить.
 */

/** Оцінка AniList (0–100) у звичну шкалу 1–10: 87 → "8.7". */
export function formatScore(averageScore: number | null): string | null {
  return averageScore == null ? null : (averageScore / 10).toFixed(1);
}
