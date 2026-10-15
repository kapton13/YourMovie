import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Série de TV", TV_SHORT: "Série curta", MOVIE: "Filme", SPECIAL: "Especial", OVA: "OVA", ONA: "ONA", MUSIC: "Clipe musical" },
  season: { WINTER: "Inverno", SPRING: "Primavera", SUMMER: "Verão", FALL: "Outono" },
  status: { FINISHED: "Finalizado", RELEASING: "Em exibição", NOT_YET_RELEASED: "Anunciado", CANCELLED: "Cancelado", HIATUS: "Em hiato" },
  source: {
    ORIGINAL: "História original", MANGA: "Mangá", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Romance",
    VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Videogame", GAME: "Jogo", WEB_MANGA: "Web mangá", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Live-action", COMIC: "Quadrinhos", MULTIMEDIA_PROJECT: "Projeto multimídia",
    PICTURE_BOOK: "Livro ilustrado", BOOK: "Livro", OTHER: "Outro",
  },
  country: { JP: "Japão", CN: "China", KR: "Coreia do Sul", TW: "Taiwan" },
  genre: {
    Action: "Ação", Adventure: "Aventura", Comedy: "Comédia", Drama: "Drama", Ecchi: "Ecchi", Fantasy: "Fantasia",
    Hentai: "Hentai", Horror: "Terror", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Música", Mystery: "Mistério",
    Psychological: "Psicológico", Romance: "Romance", "Sci-Fi": "Ficção científica", "Slice of Life": "Slice of Life",
    Sports: "Esportes", Supernatural: "Sobrenatural", Thriller: "Suspense",
  },
  relation: {
    PARENT: "História principal", SIDE_STORY: "História paralela", SPIN_OFF: "Spin-off", ALTERNATIVE: "Versão alternativa",
    SUMMARY: "Resumo", COMPILATION: "Compilação", CONTAINS: "Contém", CHARACTER: "Mesmos personagens", OTHER: "Outro",
  },
  sort: {
    relevance: "Mais relevantes", popular: "Popularidade", score: "Nota", trending: "Em alta agora", newest: "Mais recentes", oldest: "Mais antigos",
  },
  tagCategory: { Theme: "Temas", Cast: "Personagens", Setting: "Ambientação", Demographic: "Público", Technical: "Técnico" },
  part: { season: "Temporada {n}", series: "Série", MOVIE: "Filme", OVA: "OVA", SPECIAL: "Especial", MUSIC: "Clipe musical", other: "Parte" },
};

export default labels;
