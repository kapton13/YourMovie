import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Сериал", TV_SHORT: "Короткий сериал", MOVIE: "Фильм", SPECIAL: "Спешл", OVA: "OVA", ONA: "ONA", MUSIC: "Клип" },
  season: { WINTER: "Зима", SPRING: "Весна", SUMMER: "Лето", FALL: "Осень" },
  status: { FINISHED: "Завершено", RELEASING: "Выходит", NOT_YET_RELEASED: "Анонсировано", CANCELLED: "Отменено", HIATUS: "Перерыв" },
  source: {
    ORIGINAL: "Оригинальный сюжет", MANGA: "Манга", LIGHT_NOVEL: "Ранобэ", WEB_NOVEL: "Веб-новелла", NOVEL: "Роман",
    VISUAL_NOVEL: "Визуальная новелла", VIDEO_GAME: "Видеоигра", GAME: "Игра", WEB_MANGA: "Веб-манга", DOUJINSHI: "Додзинси",
    ANIME: "Аниме", LIVE_ACTION: "Игровой фильм", COMIC: "Комикс", MULTIMEDIA_PROJECT: "Мультимедийный проект",
    PICTURE_BOOK: "Книга с картинками", BOOK: "Книга", OTHER: "Другое",
  },
  country: { JP: "Япония", CN: "Китай", KR: "Южная Корея", TW: "Тайвань" },
  genre: {
    Action: "Экшен", Adventure: "Приключения", Comedy: "Комедия", Drama: "Драма", Ecchi: "Этти", Fantasy: "Фэнтези",
    Hentai: "Хентай", Horror: "Ужасы", "Mahou Shoujo": "Махо-сёдзё", Mecha: "Меха", Music: "Музыка", Mystery: "Детектив",
    Psychological: "Психологическое", Romance: "Романтика", "Sci-Fi": "Научная фантастика", "Slice of Life": "Повседневность",
    Sports: "Спорт", Supernatural: "Сверхъестественное", Thriller: "Триллер",
  },
  relation: {
    PARENT: "Основная", SIDE_STORY: "Побочная", SPIN_OFF: "Спин-офф", ALTERNATIVE: "Другая версия",
    SUMMARY: "Пересказ", COMPILATION: "Компиляция", CONTAINS: "Содержит", CHARACTER: "Те же герои", OTHER: "Другое",
  },
  sort: {
    relevance: "По совпадению названия", popular: "Популярность", score: "Оценка", trending: "Сейчас в тренде", newest: "Сначала новые", oldest: "Сначала старые",
  },
  tagCategory: { Theme: "Темы", Cast: "Персонажи", Setting: "Место и время действия", Demographic: "Аудитория", Technical: "Техническое" },
  part: { season: "Сезон {n}", series: "Сериал", MOVIE: "Фильм", OVA: "OVA", SPECIAL: "Спешл", MUSIC: "Клип", other: "Часть" },
};

export default labels;
