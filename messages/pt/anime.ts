import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Carregando…",
  poster: "Pôster: {title}",
  rating: {
    note: "Nota média dos usuários do AniList",
    votes: { one: "avaliação", other: "avaliações" },
    none: "Ainda sem nota",
  },
  nextEpisode: "Episódio {n} sai em {date}",
  franchise: {
    root: "Este anime tem {n} partes. Seu status e sua nota valem para o anime inteiro.",
    partOf: "Parte de {title}",
    quoted: "“{title}”",
    position: "({n} de {total})",
    extra: "extra",
  },
  description: {
    heading: "Sinopse",
    empty: "Ainda sem sinopse.",
    englishNote: "A sinopse está em inglês, como fornecida pelo AniList.",
    sourceNote: "Sinopse: {source}.",
  },
  tags: "Tags",
  info: {
    format: "Formato",
    episodes: "Episódios",
    duration: "Duração do episódio",
    minutes: "{n} min",
    status: "Status",
    season: "Temporada",
    dates: "Exibição",
    studio: "Estúdio",
    source: "Fonte",
    country: "País",
    popularity: "Adicionado a listas",
    anilistPage: "Página no AniList ↗",
  },
  watchOrder: "Ordem para assistir",
  announced: "A anunciar",
  related: "Relacionados",
  similar: "Animes parecidos",
};

export default anime;
