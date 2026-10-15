import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Відкривай аніме",
    text: "Що зараз дивляться, що виходить цього сезону і що варто побачити кожному.",
  },
  loading: "Завантажуємо добірки…",
  trending: "Зараз у тренді",
  currentSeason: "Поточний сезон: {season}",
  popular: "Популярне за весь час",
  top: "Топ рейтингу",
  search: {
    placeholder: "Назва аніме…",
    label: "Пошук аніме за назвою",
    submit: "Знайти",
    advanced: "Розширений пошук: жанри, роки, формат та інші фільтри →",
  },
  row: {
    seeAll: "Дивитися всі →",
    empty: "Поки що тут порожньо.",
  },
  card: {
    score: "Рейтинг {score} з 10",
    here: "Ви тут",
  },
};

export default home;
