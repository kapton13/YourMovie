import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "Serial TV", TV_SHORT: "Krótki serial", MOVIE: "Film", SPECIAL: "Odcinek specjalny", OVA: "OVA", ONA: "ONA", MUSIC: "Teledysk" },
  season: { WINTER: "Zima", SPRING: "Wiosna", SUMMER: "Lato", FALL: "Jesień" },
  status: { FINISHED: "Zakończone", RELEASING: "Emitowane", NOT_YET_RELEASED: "Zapowiedziane", CANCELLED: "Anulowane", HIATUS: "Wstrzymana emisja" },
  source: {
    ORIGINAL: "Oryginalna historia", MANGA: "Manga", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Powieść",
    VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Gra wideo", GAME: "Gra", WEB_MANGA: "Webmanga", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Film aktorski", COMIC: "Komiks", MULTIMEDIA_PROJECT: "Projekt multimedialny",
    PICTURE_BOOK: "Książka obrazkowa", BOOK: "Książka", OTHER: "Inne",
  },
  country: { JP: "Japonia", CN: "Chiny", KR: "Korea Południowa", TW: "Tajwan" },
  genre: {
    Action: "Akcja", Adventure: "Przygodowe", Comedy: "Komedia", Drama: "Dramat", Ecchi: "Ecchi", Fantasy: "Fantasy",
    Hentai: "Hentai", Horror: "Horror", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Muzyka", Mystery: "Tajemnica",
    Psychological: "Psychologiczne", Romance: "Romans", "Sci-Fi": "Sci-Fi", "Slice of Life": "Okruchy życia",
    Sports: "Sport", Supernatural: "Nadprzyrodzone", Thriller: "Thriller",
  },
  relation: {
    PARENT: "Główna historia", SIDE_STORY: "Historia poboczna", SPIN_OFF: "Spin-off", ALTERNATIVE: "Wersja alternatywna",
    SUMMARY: "Podsumowanie", COMPILATION: "Kompilacja", CONTAINS: "Zawiera", CHARACTER: "Te same postacie", OTHER: "Inne",
  },
  sort: {
    relevance: "Najlepsze dopasowanie", popular: "Popularność", score: "Ocena", trending: "Teraz na topie", newest: "Od najnowszych", oldest: "Od najstarszych",
  },
  tagCategory: { Theme: "Motywy", Cast: "Postacie", Setting: "Miejsce i czas akcji", Demographic: "Odbiorcy", Technical: "Techniczne" },
  part: { season: "Sezon {n}", series: "Serial", MOVIE: "Film", OVA: "OVA", SPECIAL: "Odcinek specjalny", MUSIC: "Teledysk", other: "Część" },
};

export default labels;
