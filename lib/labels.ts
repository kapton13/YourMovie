import type { MediaFormat, Season } from "./anilist";

export const FORMAT_LABELS: Record<MediaFormat, string> = {
  TV: "Серіал",
  TV_SHORT: "Короткий серіал",
  MOVIE: "Фільм",
  SPECIAL: "Спешл",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Кліп",
};

export const SEASON_LABELS: Record<Season, string> = {
  WINTER: "Зима",
  SPRING: "Весна",
  SUMMER: "Літо",
  FALL: "Осінь",
};

/** Оцінка AniList (0–100) у звичну шкалу 1–10. */
export function formatScore(averageScore: number | null): string | null {
  return averageScore == null ? null : (averageScore / 10).toFixed(1);
}
