import type { FuzzyDate, MediaFormat, MediaStatus, RelationType, Season } from "./anilist";

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

export const STATUS_LABELS: Record<MediaStatus, string> = {
  FINISHED: "Завершено",
  RELEASING: "Виходить",
  NOT_YET_RELEASED: "Анонсовано",
  CANCELLED: "Скасовано",
  HIATUS: "Перерва",
};

export const SOURCE_LABELS: Record<string, string> = {
  ORIGINAL: "Оригінальний сюжет",
  MANGA: "Манга",
  LIGHT_NOVEL: "Ранобе",
  WEB_NOVEL: "Вебновела",
  NOVEL: "Роман",
  VISUAL_NOVEL: "Візуальна новела",
  VIDEO_GAME: "Відеогра",
  GAME: "Гра",
  WEB_MANGA: "Вебманга",
  DOUJINSHI: "Додзінсі",
  ANIME: "Аніме",
  LIVE_ACTION: "Ігровий фільм",
  COMIC: "Комікс",
  MULTIMEDIA_PROJECT: "Мультимедійний проєкт",
  PICTURE_BOOK: "Книжка з картинками",
  BOOK: "Книга",
  OTHER: "Інше",
};

export const COUNTRY_LABELS: Record<string, string> = {
  JP: "Японія",
  CN: "Китай",
  KR: "Південна Корея",
  TW: "Тайвань",
};

export const GENRE_LABELS: Record<string, string> = {
  Action: "Екшн",
  Adventure: "Пригоди",
  Comedy: "Комедія",
  Drama: "Драма",
  Ecchi: "Етті",
  Fantasy: "Фентезі",
  Hentai: "Хентай",
  Horror: "Жахи",
  "Mahou Shoujo": "Махо-сьодзьо",
  Mecha: "Меха",
  Music: "Музика",
  Mystery: "Детектив",
  Psychological: "Психологічне",
  Romance: "Романтика",
  "Sci-Fi": "Наукова фантастика",
  "Slice of Life": "Повсякдення",
  Sports: "Спорт",
  Supernatural: "Надприродне",
  Thriller: "Трилер",
};

export const RELATION_LABELS: Partial<Record<RelationType, string>> = {
  PARENT: "Основна",
  SIDE_STORY: "Побічна",
  SPIN_OFF: "Спін-оф",
  ALTERNATIVE: "Інша версія",
  SUMMARY: "Підсумок",
  COMPILATION: "Збірка",
  CONTAINS: "Містить",
  CHARACTER: "Ті ж герої",
  OTHER: "Інше",
};

const MONTHS_GENITIVE = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];

const MONTHS_NOMINATIVE = [
  "січень", "лютий", "березень", "квітень", "травень", "червень",
  "липень", "серпень", "вересень", "жовтень", "листопад", "грудень",
];

/** «14 жовтня 2026», «жовтень 2026» або «2026» — залежно від того, що відомо. */
export function formatFuzzyDate({ year, month, day }: FuzzyDate): string | null {
  if (!year) return null;
  if (!month) return String(year);
  if (!day) return `${MONTHS_NOMINATIVE[month - 1]} ${year}`;
  return `${day} ${MONTHS_GENITIVE[month - 1]} ${year}`;
}

/** Дата виходу наступної серії за київським часом, напр. «18 жовтня». */
export function formatAiringDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Kyiv",
  }).format(new Date(unixSeconds * 1000));
}
