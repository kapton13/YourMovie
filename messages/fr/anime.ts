import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Chargement…",
  poster: "Affiche : {title}",
  rating: {
    note: "Note moyenne des utilisateurs d’AniList",
    votes: { one: "vote", many: "votes", other: "votes" },
    none: "Pas encore de note",
  },
  nextEpisode: "L’épisode {n} sortira le {date}",
  franchise: {
    root: "Cet anime compte {n} parties. Votre statut et votre note s’appliquent à l’anime entier.",
    partOf: "Fait partie de {title}",
    quoted: "« {title} »",
    position: "({n} sur {total})",
    extra: "bonus",
  },
  description: {
    heading: "Synopsis",
    empty: "Pas encore de synopsis.",
    englishNote: "Le synopsis est en anglais, tel que fourni par AniList.",
    sourceNote: "Synopsis : {source}.",
  },
  tags: "Tags",
  info: {
    format: "Format",
    episodes: "Épisodes",
    duration: "Durée d’un épisode",
    minutes: "{n} min",
    status: "Statut",
    season: "Saison",
    dates: "Diffusion",
    studio: "Studio",
    source: "Source",
    country: "Pays",
    popularity: "Ajouts aux listes",
    anilistPage: "Page AniList ↗",
  },
  watchOrder: "Ordre de visionnage",
  announced: "À venir",
  related: "Œuvres liées",
  similar: "Animes similaires",
};

export default anime;
