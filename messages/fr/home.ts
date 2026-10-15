import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Découvrez des animes",
    text: "Ce que l’on regarde en ce moment, ce qui sort cette saison et les incontournables.",
  },
  loading: "Chargement de la sélection…",
  trending: "Tendances du moment",
  currentSeason: "Cette saison : {season}",
  seasonName: "{season} {year}",
  popular: "Les plus populaires",
  top: "Les mieux notés",
  search: {
    placeholder: "Titre de l’anime…",
    label: "Rechercher un anime par titre",
    submit: "Rechercher",
    advanced: "Recherche avancée : genres, années, format et autres filtres →",
  },
  row: {
    seeAll: "Tout voir →",
    empty: "Rien pour l’instant.",
  },
  card: {
    score: "Note : {score} sur 10",
    here: "Vous êtes ici",
  },
};

export default home;
