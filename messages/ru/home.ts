import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Открывай аниме",
    text: "Что сейчас смотрят, что выходит в этом сезоне и что стоит увидеть каждому.",
  },
  loading: "Загружаем подборки…",
  trending: "Сейчас в тренде",
  currentSeason: "Текущий сезон: {season}",
  popular: "Популярное за всё время",
  top: "Топ рейтинга",
  search: {
    placeholder: "Название аниме…",
    label: "Поиск аниме по названию",
    submit: "Найти",
    advanced: "Расширенный поиск: жанры, годы, формат и другие фильтры →",
  },
  row: {
    seeAll: "Смотреть все →",
    empty: "Пока здесь пусто.",
  },
  card: {
    score: "Рейтинг {score} из 10",
    here: "Вы здесь",
  },
};

export default home;
