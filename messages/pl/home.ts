import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Odkrywaj anime",
    text: "Co ludzie oglądają teraz, co leci w tym sezonie i co każdy powinien zobaczyć.",
  },
  loading: "Ładowanie propozycji…",
  trending: "Teraz na topie",
  currentSeason: "Ten sezon: {season}",
  seasonName: "{season} {year}",
  popular: "Najpopularniejsze wszech czasów",
  top: "Najwyżej oceniane",
  search: {
    placeholder: "Tytuł anime…",
    label: "Szukaj anime po tytule",
    submit: "Szukaj",
    advanced: "Wyszukiwanie zaawansowane: gatunki, lata, format i więcej filtrów →",
  },
  row: {
    seeAll: "Zobacz wszystkie →",
    empty: "Na razie nic tu nie ma.",
  },
  card: {
    score: "Ocena {score} na 10",
    here: "Jesteś tutaj",
  },
};

export default home;
