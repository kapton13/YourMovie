import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Serie de TV", TV_SHORT: "Serie corta", MOVIE: "Película", SPECIAL: "Especial", OVA: "OVA", ONA: "ONA", MUSIC: "Videoclip" },
  season: { WINTER: "Invierno", SPRING: "Primavera", SUMMER: "Verano", FALL: "Otoño" },
  status: { FINISHED: "Finalizado", RELEASING: "En emisión", NOT_YET_RELEASED: "Anunciado", CANCELLED: "Cancelado", HIATUS: "En hiato" },
  source: {
    ORIGINAL: "Historia original", MANGA: "Manga", LIGHT_NOVEL: "Novela ligera", WEB_NOVEL: "Novela web", NOVEL: "Novela",
    VISUAL_NOVEL: "Novela visual", VIDEO_GAME: "Videojuego", GAME: "Juego", WEB_MANGA: "Manga web", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Acción real", COMIC: "Cómic", MULTIMEDIA_PROJECT: "Proyecto multimedia",
    PICTURE_BOOK: "Libro ilustrado", BOOK: "Libro", OTHER: "Otro",
  },
  country: { JP: "Japón", CN: "China", KR: "Corea del Sur", TW: "Taiwán" },
  genre: {
    Action: "Acción", Adventure: "Aventura", Comedy: "Comedia", Drama: "Drama", Ecchi: "Ecchi", Fantasy: "Fantasía",
    Hentai: "Hentai", Horror: "Terror", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Música", Mystery: "Misterio",
    Psychological: "Psicológico", Romance: "Romance", "Sci-Fi": "Ciencia ficción", "Slice of Life": "Recuentos de la vida",
    Sports: "Deportes", Supernatural: "Sobrenatural", Thriller: "Thriller",
  },
  relation: {
    PARENT: "Historia principal", SIDE_STORY: "Historia paralela", SPIN_OFF: "Spin-off", ALTERNATIVE: "Versión alternativa",
    SUMMARY: "Resumen", COMPILATION: "Recopilación", CONTAINS: "Contiene", CHARACTER: "Mismos personajes", OTHER: "Otro",
  },
  sort: {
    relevance: "Mejor coincidencia", popular: "Popularidad", score: "Puntuación", trending: "Tendencia ahora", newest: "Más recientes", oldest: "Más antiguos",
  },
  tagCategory: { Theme: "Temas", Cast: "Personajes", Setting: "Ambientación", Demographic: "Público", Technical: "Aspectos técnicos" },
  part: { season: "Temporada {n}", series: "Serie", MOVIE: "Película", OVA: "OVA", SPECIAL: "Especial", MUSIC: "Videoclip", other: "Parte" },
};

export default labels;
