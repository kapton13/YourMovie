import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Трекер аніме: каталог, особисті списки та рекомендації.",
  siteTitle: "YourMovie — трекер аніме",
  nav: {
    home: "Головна",
    catalog: "Каталог",
    myAnime: "Мої аніме",
    recommendations: "Рекомендації",
    login: "Увійти",
    myProfile: "Мій профіль ({name})",
  },
  theme: { toggle: "Змінити тему: день або ніч" },
  language: { label: "Мова сайту", choose: "Мова" },
  footer: { dataBy: "Дані про аніме надає {source}.", shikimori: "Російські назви й описи: {source}." },
  notFound: {
    title: "Такої сторінки немає",
    text: "Можливо, посилання застаріло або в ньому помилка.",
    home: "На головну",
    animeTitle: "Такого аніме не знайдено",
    animeText: "Можливо, посилання застаріло.",
    toCatalog: "Перейти до каталогу",
  },
  anilistError: "Не вдалося завантажити дані з AniList. Спробуйте оновити сторінку трохи згодом.",
  saveError: "Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз.",
  loading: "Завантаження…",
  untitled: "Без назви",
  yes: "Так",
  no: "Ні",
  cancel: "Скасувати",
  close: "Закрити",
  done: "Готово",
  episodes: { one: "серія", few: "серії", many: "серій", other: "серії" },
  anime: { one: "аніме", few: "аніме", many: "аніме", other: "аніме" },
};

export default common;
