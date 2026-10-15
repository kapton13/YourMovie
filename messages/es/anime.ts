import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Cargando…",
  poster: "Póster: {title}",
  rating: {
    note: "Puntuación media de los usuarios de AniList",
    votes: { one: "valoración", other: "valoraciones" },
    none: "Aún sin puntuación",
  },
  nextEpisode: "El episodio {n} se estrena el {date}",
  franchise: {
    root: "Este anime tiene {n} partes. Tu estado y tu puntuación se aplican a todo el anime.",
    partOf: "Parte de {title}",
    quoted: "«{title}»",
    position: "({n} de {total})",
    extra: "extra",
  },
  description: {
    heading: "Descripción",
    empty: "Aún no hay descripción.",
    englishNote: "La descripción está en inglés, tal como la ofrece AniList.",
    sourceNote: "Descripción: {source}.",
  },
  tags: "Etiquetas",
  info: {
    format: "Formato",
    episodes: "Episodios",
    duration: "Duración del episodio",
    minutes: "{n} min",
    status: "Estado",
    season: "Temporada",
    dates: "Emisión",
    studio: "Estudio",
    source: "Origen",
    country: "País",
    popularity: "Añadido a listas",
    anilistPage: "Página en AniList ↗",
  },
  watchOrder: "Orden para verlo",
  announced: "Por anunciar",
  related: "Relacionados",
  similar: "Animes similares",
};

export default anime;
