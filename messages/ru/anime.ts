import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Аниме — YourMovie",
  loading: "Загружаем…",
  poster: "Постер: {title}",
  rating: {
    note: "Средняя оценка пользователей AniList",
    votes: { one: "оценка", few: "оценки", many: "оценок", other: "оценки" },
    none: "Оценки пока нет",
  },
  nextEpisode: "Серия {n} выйдет {date}",
  franchise: {
    root: "Аниме из нескольких частей: {n}. Ваш статус и оценка — для всего аниме.",
    partOf: "Часть аниме {title}",
    quoted: "«{title}»",
    position: "({n} из {total})",
    extra: "дополнительно",
  },
  description: {
    heading: "Описание",
    empty: "Описания пока нет.",
    englishNote: "Описание на английском — так его предоставляет AniList.",
    sourceNote: "Описание: {source}.",
  },
  tags: "Теги",
  info: {
    format: "Формат",
    episodes: "Серий",
    duration: "Длительность серии",
    minutes: "{n} мин",
    status: "Статус",
    season: "Сезон",
    dates: "Даты выхода",
    studio: "Студия",
    source: "Первоисточник",
    country: "Страна",
    popularity: "Добавили в списки",
    anilistPage: "Страница на AniList ↗",
  },
  watchOrder: "Порядок просмотра",
  announced: "Анонс",
  related: "Связанное",
  similar: "Похожие аниме",
};

export default anime;
