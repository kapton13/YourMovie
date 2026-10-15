import type { Messages } from "..";

const hidden: Messages["hidden"] = {
  tab: "Pas intéressé",
  empty: "Les animes que vous masquez avec la croix rouge ✕ apparaîtront ici. Le site ne les affichera plus et ne les recommandera plus.",
  note: "Le site n’affiche pas ces animes sur la page d’accueil, dans le catalogue ni dans les recommandations.",
  animeNumber: "Anime n° {id}",
  restore: "Rétablir",
  toast: "« {title} » ne sera plus affiché.",
  undo: "Annuler",
  crossLabel: "Pas intéressé : « {title} » — ne plus afficher",
  crossTitle: "Pas intéressé — ne plus afficher",
};

export default hidden;
