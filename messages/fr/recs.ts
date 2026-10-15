import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Recommandations — YourMovie",
  title: "Recommandations",
  forYou: "Pour vous",
  guest: "{link} et nous choisirons des animes d’après vos listes et vos notes.",
  guestLink: "Connectez-vous",
  loading: "Sélection d’animes d’après vos listes et vos notes…",
  error: "Impossible de charger les recommandations. Veuillez actualiser la page un peu plus tard.",
  lead: "Sélection basée sur {count} de vos listes et sur vos notes. Les plus pertinents en premier.",
  leadEmpty: "Nous ne connaissons pas encore bien vos goûts, alors voici ce qui est populaire.",
  hint: "Ajoutez à vos listes au moins 3 animes que vous avez vus et notez-les pour obtenir des recommandations plus précises.",
  toCatalog: "Aller au catalogue →",
  filters: {
    kind: "Type",
    airing: "Statut",
    genre: "Genre",
    allGenres: "Tous les genres",
    kinds: { all: "Tous", series: "Séries", movies: "Films" },
    airingOptions: { all: "Tous", finished: "Diffusion terminée", releasing: "En diffusion" },
  },
  more: "Afficher plus",
  noResults: "Rien ne correspond à ces filtres. Essayez-en d’autres.",
  reason: {
    rated: "Parce que vous avez donné {score}/10 à « {title} »",
    similarOne: "Similaire à « {title} »",
    similarTwo: "Similaire à « {first} » et « {second} »",
    popular: "Populaire sur AniList",
  },
};

export default recs;
