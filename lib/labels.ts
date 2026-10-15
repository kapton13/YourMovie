/**
 * Назви жанрів, форматів, сезонів тощо — у словниках мов (`messages/<мова>/labels.ts`),
 * дати — у `lib/i18n/labels.ts`. Тут лишилося форматування оцінки AniList.
 */

/** Оцінка AniList (0–100) у звичну шкалу 1–10 за правилами мови: 87 → "8.7" / "8,7". */
export function formatScore(averageScore: number | null, intl = "en-US"): string | null {
  return averageScore == null
    ? null
    : (averageScore / 10).toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
