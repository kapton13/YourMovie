import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Entdecke Anime",
    text: "Was gerade alle schauen, was diese Season läuft und was man unbedingt gesehen haben sollte.",
  },
  loading: "Auswahl wird geladen…",
  trending: "Gerade angesagt",
  currentSeason: "Diese Season: {season}",
  seasonName: "{season} {year}",
  popular: "Beliebt aller Zeiten",
  top: "Bestbewertet",
  search: {
    placeholder: "Anime-Titel…",
    label: "Anime nach Titel suchen",
    submit: "Suchen",
    advanced: "Erweiterte Suche: Genres, Jahre, Format und mehr Filter →",
  },
  row: {
    seeAll: "Alle ansehen →",
    empty: "Hier ist noch nichts.",
  },
  card: {
    score: "Bewertung {score} von 10",
    here: "Du bist hier",
  },
};

export default home;
