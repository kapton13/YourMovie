import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Рекомендації — YourMovie",
  title: "Рекомендації",
  forYou: "Для вас",
  guest: "{link}, і ми підберемо аніме за вашими списками й оцінками.",
  guestLink: "Увійдіть",
  loading: "Підбираємо аніме за вашими списками й оцінками…",
  error: "Не вдалося підібрати рекомендації. Спробуйте оновити сторінку трохи згодом.",
  lead: "Підібрано за {count} з ваших списків і вашими оцінками. Що вище — то більше підходить.",
  leadEmpty: "Поки що ми мало знаємо про ваш смак, тому показуємо популярне.",
  hint: "Додайте в списки й оцініть хоча б 3 аніме, які ви дивилися, — рекомендації стануть точнішими.",
  toCatalog: "Перейти до каталогу →",
  filters: {
    kind: "Тип",
    airing: "Статус",
    genre: "Жанр",
    allGenres: "Усі жанри",
    kinds: { all: "Усі", series: "Серіали", movies: "Фільми" },
    airingOptions: { all: "Усі", finished: "Завершені", releasing: "Виходять зараз" },
  },
  more: "Показати ще",
  noResults: "За цими фільтрами нічого не знайшлося. Спробуйте інші.",
  reason: {
    rated: "Бо ви оцінили «{title}» на {score}",
    similarOne: "Схоже на «{title}»",
    similarTwo: "Схоже на «{first}» і «{second}»",
    popular: "Популярне на AniList",
  },
};

export default recs;
