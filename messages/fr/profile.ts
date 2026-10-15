import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — profil sur YourMovie",
  missing: {
    title: "Utilisateur introuvable",
    text: "Aucun utilisateur n’a le pseudo « {nickname} ». Il l’a peut-être changé.",
  },
  error: {
    title: "Impossible de charger le profil",
    text: "Veuillez actualiser la page un peu plus tard.",
    retry: "Réessayer",
  },
  mediaFailed: "Impossible de charger les données des animes depuis AniList : les heures, les genres et les affiches manquent pour l’instant.",
  closed: "🔒 Ce profil est privé : {nickname} ne partage pas ses listes.",
  since: "membre depuis le {date}",
  own: {
    public: "🌐 Profil public : toute personne disposant du lien peut voir cette page.",
    private: "🔒 Profil privé : vous seul pouvez voir vos statistiques et vos listes.",
    copy: "Copier le lien",
    copied: "Copié ✓",
    settings: "Paramètres",
  },
  tiles: {
    label: "Résumé",
    anime: "animes dans les listes",
    episodes: "épisodes vus",
    hours: "heures de visionnage",
    hoursDays: "heures ≈ {days} jours",
    average: "note moyenne",
  },
  scores: {
    title: "Notes",
    tip: "Note {score} : {count}",
    caption: "Nombre d’animes ayant reçu chaque note de 1 à 10",
    empty: "Aucun anime noté pour l’instant.",
  },
  months: {
    title: "Épisodes par mois",
    caption: "Nombre d’épisodes marqués comme vus chaque mois au cours de l’année écoulée",
    footnote: "Selon la date à laquelle ils ont été cochés : « J’ai vu toute la saison » enregistre tous les épisodes le même jour.",
    empty: "Aucun épisode coché au cours de l’année écoulée.",
  },
  genres: {
    title: "Genres préférés",
    empty: "Les genres apparaîtront dès que vos listes contiendront des animes en cours ou terminés.",
  },
  lists: {
    title: "Listes",
    empty: "Cette liste est vide pour l’instant.",
  },
  status: {
    watching: "En cours",
    planning: "À voir",
    completed: "Terminé",
    paused: "En pause",
    dropped: "Abandonné",
  },
};

export default profile;
