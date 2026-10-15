import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Suivi d’anime : catalogue, listes personnelles et recommandations.",
  siteTitle: "YourMovie — suivi d’anime",
  nav: {
    home: "Accueil",
    catalog: "Catalogue",
    myAnime: "Mes animes",
    recommendations: "Recommandations",
    login: "Se connecter",
    myProfile: "Mon profil ({name})",
  },
  theme: { toggle: "Passer en thème clair / sombre" },
  language: { label: "Langue du site", choose: "Langue" },
  footer: { dataBy: "Données sur les animes fournies par {source}.", shikimori: "Titres et descriptions en russe : {source}." },
  notFound: {
    title: "Page introuvable",
    text: "Le lien est peut-être obsolète ou contient une faute de frappe.",
    home: "Retour à l’accueil",
    animeTitle: "Anime introuvable",
    animeText: "Le lien est peut-être obsolète.",
    toCatalog: "Aller au catalogue",
  },
  anilistError: "Impossible de charger les données d’AniList. Veuillez actualiser la page un peu plus tard.",
  saveError: "Impossible d’enregistrer. Vérifiez votre connexion et réessayez.",
  loading: "Chargement…",
  untitled: "Sans titre",
  yes: "Oui",
  no: "Non",
  cancel: "Annuler",
  close: "Fermer",
  done: "Terminé",
  episodes: { one: "épisode", many: "épisodes", other: "épisodes" },
  anime: { one: "anime", many: "animes", other: "animes" },
};

export default common;
