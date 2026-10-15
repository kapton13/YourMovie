import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Аніме — YourMovie",
  loading: "Завантажуємо…",
  poster: "Постер: {title}",
  rating: {
    note: "Середня оцінка користувачів AniList",
    votes: { one: "оцінка", few: "оцінки", many: "оцінок", other: "оцінки" },
    none: "Оцінки ще немає",
  },
  nextEpisode: "Серія {n} вийде {date}",
  franchise: {
    root: "Аніме з кількох частин: {n}. Ваш статус і оцінка — для всього аніме.",
    partOf: "Частина аніме {title}",
    quoted: "«{title}»",
    position: "({n} з {total})",
    extra: "додатково",
  },
  description: {
    heading: "Опис",
    empty: "Опису поки немає.",
    englishNote: "Опис англійською — так його надає AniList.",
    sourceNote: "Опис: {source}.",
  },
  tags: "Теги",
  info: {
    format: "Формат",
    episodes: "Серій",
    duration: "Тривалість серії",
    minutes: "{n} хв",
    status: "Статус",
    season: "Сезон",
    dates: "Дати виходу",
    studio: "Студія",
    source: "Першоджерело",
    country: "Країна",
    popularity: "Додали до списків",
    anilistPage: "Сторінка на AniList ↗",
  },
  watchOrder: "Порядок перегляду",
  announced: "Анонс",
  related: "Пов'язане",
  similar: "Схожі аніме",
};

export default anime;
