import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Série TV", TV_SHORT: "Série courte", MOVIE: "Film", SPECIAL: "Spécial", OVA: "OVA", ONA: "ONA", MUSIC: "Clip musical" },
  season: { WINTER: "Hiver", SPRING: "Printemps", SUMMER: "Été", FALL: "Automne" },
  status: { FINISHED: "Diffusion terminée", RELEASING: "En diffusion", NOT_YET_RELEASED: "Annoncé", CANCELLED: "Annulé", HIATUS: "Interrompu" },
  source: {
    ORIGINAL: "Œuvre originale", MANGA: "Manga", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Roman",
    VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Jeu vidéo", GAME: "Jeu", WEB_MANGA: "Webmanga", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Live action", COMIC: "Bande dessinée", MULTIMEDIA_PROJECT: "Projet multimédia",
    PICTURE_BOOK: "Livre illustré", BOOK: "Livre", OTHER: "Autre",
  },
  country: { JP: "Japon", CN: "Chine", KR: "Corée du Sud", TW: "Taïwan" },
  genre: {
    Action: "Action", Adventure: "Aventure", Comedy: "Comédie", Drama: "Drame", Ecchi: "Ecchi", Fantasy: "Fantasy",
    Hentai: "Hentai", Horror: "Horreur", "Mahou Shoujo": "Magical girl", Mecha: "Mecha", Music: "Musique", Mystery: "Mystère",
    Psychological: "Psychologique", Romance: "Romance", "Sci-Fi": "Science-fiction", "Slice of Life": "Tranche de vie",
    Sports: "Sport", Supernatural: "Surnaturel", Thriller: "Thriller",
  },
  relation: {
    PARENT: "Histoire principale", SIDE_STORY: "Histoire parallèle", SPIN_OFF: "Spin-off", ALTERNATIVE: "Version alternative",
    SUMMARY: "Résumé", COMPILATION: "Compilation", CONTAINS: "Contient", CHARACTER: "Mêmes personnages", OTHER: "Autre",
  },
  sort: {
    relevance: "Pertinence", popular: "Popularité", score: "Note", trending: "Tendances", newest: "Plus récents", oldest: "Plus anciens",
  },
  tagCategory: { Theme: "Thèmes", Cast: "Personnages", Setting: "Cadre", Demographic: "Public", Technical: "Technique" },
  part: { season: "Saison {n}", series: "Série", MOVIE: "Film", OVA: "OVA", SPECIAL: "Spécial", MUSIC: "Clip musical", other: "Partie" },
};

export default labels;
