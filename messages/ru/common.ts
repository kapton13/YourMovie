import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Трекер аниме: каталог, личные списки и рекомендации.",
  siteTitle: "YourMovie — трекер аниме",
  nav: {
    home: "Главная",
    catalog: "Каталог",
    myAnime: "Мои аниме",
    recommendations: "Рекомендации",
    login: "Войти",
    myProfile: "Мой профиль ({name})",
  },
  theme: { toggle: "Сменить тему: день или ночь" },
  language: { label: "Язык сайта", choose: "Язык" },
  footer: { dataBy: "Данные об аниме предоставляет {source}.", shikimori: "Русские названия и описания: {source}." },
  notFound: {
    title: "Такой страницы нет",
    text: "Возможно, ссылка устарела или в ней ошибка.",
    home: "На главную",
    animeTitle: "Такое аниме не найдено",
    animeText: "Возможно, ссылка устарела.",
    toCatalog: "Перейти в каталог",
  },
  anilistError: "Не удалось загрузить данные с AniList. Попробуйте обновить страницу чуть позже.",
  tooMany: { title: "Слишком много запросов", text: "Вы ищете очень быстро. Подождите минутку и попробуйте снова." },
  saveError: "Не удалось сохранить. Проверьте интернет и попробуйте ещё раз.",
  loading: "Загрузка…",
  untitled: "Без названия",
  yes: "Да",
  no: "Нет",
  cancel: "Отмена",
  close: "Закрыть",
  done: "Готово",
  episodes: { one: "серия", few: "серии", many: "серий", other: "серии" },
  anime: { one: "аниме", few: "аниме", many: "аниме", other: "аниме" },
};

export default common;
