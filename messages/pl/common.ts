import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Tracker anime: katalog, osobiste listy i rekomendacje.",
  siteTitle: "YourMovie — tracker anime",
  nav: {
    home: "Strona główna",
    catalog: "Katalog",
    myAnime: "Moje anime",
    recommendations: "Rekomendacje",
    login: "Zaloguj się",
    myProfile: "Mój profil ({name})",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "{n} anime z nowymi odcinkami", few: "{n} anime z nowymi odcinkami", many: "{n} anime z nowymi odcinkami", other: "{n} anime z nowymi odcinkami" },
  },
  theme: { toggle: "Przełącz motyw: dzień / noc" },
  language: { label: "Język strony", choose: "Język" },
  footer: { dataBy: "Dane o anime pochodzą z {source}.", shikimori: "Rosyjskie tytuły i opisy: {source}." },
  notFound: {
    title: "Nie znaleziono strony",
    text: "Link może być nieaktualny lub zawierać literówkę.",
    home: "Przejdź na stronę główną",
    animeTitle: "Nie znaleziono anime",
    animeText: "Link może być nieaktualny.",
    toCatalog: "Przejdź do katalogu",
  },
  anilistError: "Nie udało się pobrać danych z AniList. Odśwież stronę za chwilę.",
  tooMany: { title: "Zbyt wiele zapytań", text: "Szukasz bardzo szybko. Odczekaj minutę i spróbuj ponownie." },
  saveError: "Nie udało się zapisać. Sprawdź połączenie i spróbuj ponownie.",
  loading: "Ładowanie…",
  untitled: "Bez tytułu",
  yes: "Tak",
  no: "Nie",
  cancel: "Anuluj",
  close: "Zamknij",
  done: "Gotowe",
  episodes: { one: "odcinek", few: "odcinki", many: "odcinków", other: "odcinka" },
  anime: { one: "anime", few: "anime", many: "anime", other: "anime" },
};

export default common;
