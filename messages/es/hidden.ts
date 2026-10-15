import type { Messages } from "..";

const hidden: Messages["hidden"] = {
  tab: "No me interesa",
  empty: "Aquí aparecerán los animes que ocultes con la cruz roja ✕. El sitio no los mostrará ni los recomendará.",
  note: "El sitio no muestra estos animes en el inicio, en el catálogo ni en las recomendaciones.",
  animeNumber: "Anime #{id}",
  restore: "Restaurar",
  toast: "«{title}» ya no se mostrará.",
  undo: "Deshacer",
  crossLabel: "No me interesa: «{title}» — no volver a mostrar",
  crossTitle: "No me interesa — no volver a mostrar",
};

export default hidden;
