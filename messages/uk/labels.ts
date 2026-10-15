import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Серіал", TV_SHORT: "Короткий серіал", MOVIE: "Фільм", SPECIAL: "Спешл", OVA: "OVA", ONA: "ONA", MUSIC: "Кліп" },
  season: { WINTER: "Зима", SPRING: "Весна", SUMMER: "Літо", FALL: "Осінь" },
  status: { FINISHED: "Завершено", RELEASING: "Виходить", NOT_YET_RELEASED: "Анонсовано", CANCELLED: "Скасовано", HIATUS: "Перерва" },
  source: {
    ORIGINAL: "Оригінальний сюжет", MANGA: "Манга", LIGHT_NOVEL: "Ранобе", WEB_NOVEL: "Вебновела", NOVEL: "Роман",
    VISUAL_NOVEL: "Візуальна новела", VIDEO_GAME: "Відеогра", GAME: "Гра", WEB_MANGA: "Вебманга", DOUJINSHI: "Додзінсі",
    ANIME: "Аніме", LIVE_ACTION: "Ігровий фільм", COMIC: "Комікс", MULTIMEDIA_PROJECT: "Мультимедійний проєкт",
    PICTURE_BOOK: "Книжка з картинками", BOOK: "Книга", OTHER: "Інше",
  },
  country: { JP: "Японія", CN: "Китай", KR: "Південна Корея", TW: "Тайвань" },
  genre: {
    Action: "Екшн", Adventure: "Пригоди", Comedy: "Комедія", Drama: "Драма", Ecchi: "Етті", Fantasy: "Фентезі",
    Hentai: "Хентай", Horror: "Жахи", "Mahou Shoujo": "Махо-сьодзьо", Mecha: "Меха", Music: "Музика", Mystery: "Детектив",
    Psychological: "Психологічне", Romance: "Романтика", "Sci-Fi": "Наукова фантастика", "Slice of Life": "Повсякдення",
    Sports: "Спорт", Supernatural: "Надприродне", Thriller: "Трилер",
  },
  relation: {
    PARENT: "Основна", SIDE_STORY: "Побічна", SPIN_OFF: "Спін-оф", ALTERNATIVE: "Інша версія",
    SUMMARY: "Підсумок", COMPILATION: "Збірка", CONTAINS: "Містить", CHARACTER: "Ті ж герої", OTHER: "Інше",
  },
  sort: {
    relevance: "За збігом назви", popular: "Популярність", score: "Оцінка", trending: "Зараз у тренді", newest: "Спершу нові", oldest: "Спершу старі",
  },
  tagCategory: { Theme: "Теми", Cast: "Персонажі", Setting: "Місце й час дії", Demographic: "Аудиторія", Technical: "Технічне" },
  part: { season: "Сезон {n}", series: "Серіал", MOVIE: "Фільм", OVA: "OVA", SPECIAL: "Спешл", MUSIC: "Кліп", other: "Частина" },
};

export default labels;
