import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Рекомендации — YourMovie",
  title: "Рекомендации",
  forYou: "Для вас",
  guest: "{link}, и мы подберём аниме по вашим спискам и оценкам.",
  guestLink: "Войдите",
  loading: "Подбираем аниме по вашим спискам и оценкам…",
  error: "Не удалось подобрать рекомендации. Попробуйте обновить страницу чуть позже.",
  lead: "Подобрано по {count} из ваших списков и вашим оценкам. Чем выше — тем лучше подходит.",
  leadEmpty: "Пока мы мало знаем о вашем вкусе, поэтому показываем популярное.",
  hint: "Добавьте в списки и оцените хотя бы 3 аниме, которые вы смотрели, — рекомендации станут точнее.",
  toCatalog: "Перейти в каталог →",
  filters: {
    kind: "Тип",
    airing: "Статус",
    genre: "Жанр",
    allGenres: "Все жанры",
    kinds: { all: "Все", series: "Сериалы", movies: "Фильмы" },
    airingOptions: { all: "Все", finished: "Завершённые", releasing: "Выходят сейчас" },
  },
  more: "Показать ещё",
  noResults: "По этим фильтрам ничего не нашлось. Попробуйте другие.",
  reason: {
    rated: "Потому что вы оценили «{title}» на {score}",
    similarOne: "Похоже на «{title}»",
    similarTwo: "Похоже на «{first}» и «{second}»",
    popular: "Популярное на AniList",
  },
};

export default recs;
