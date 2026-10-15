import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "TV-Serie", TV_SHORT: "Kurzserie", MOVIE: "Film", SPECIAL: "Special", OVA: "OVA", ONA: "ONA", MUSIC: "Musikvideo" },
  season: { WINTER: "Winter", SPRING: "Frühling", SUMMER: "Sommer", FALL: "Herbst" },
  status: { FINISHED: "Abgeschlossen", RELEASING: "Läuft", NOT_YET_RELEASED: "Angekündigt", CANCELLED: "Abgesagt", HIATUS: "Pausiert" },
  source: {
    ORIGINAL: "Originalgeschichte", MANGA: "Manga", LIGHT_NOVEL: "Light Novel", WEB_NOVEL: "Web Novel", NOVEL: "Roman",
    VISUAL_NOVEL: "Visual Novel", VIDEO_GAME: "Videospiel", GAME: "Spiel", WEB_MANGA: "Webmanga", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Realverfilmung", COMIC: "Comic", MULTIMEDIA_PROJECT: "Multimedia-Projekt",
    PICTURE_BOOK: "Bilderbuch", BOOK: "Buch", OTHER: "Sonstiges",
  },
  country: { JP: "Japan", CN: "China", KR: "Südkorea", TW: "Taiwan" },
  genre: {
    Action: "Action", Adventure: "Abenteuer", Comedy: "Komödie", Drama: "Drama", Ecchi: "Ecchi", Fantasy: "Fantasy",
    Hentai: "Hentai", Horror: "Horror", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Musik", Mystery: "Mystery",
    Psychological: "Psychologisch", Romance: "Romantik", "Sci-Fi": "Sci-Fi", "Slice of Life": "Slice of Life",
    Sports: "Sport", Supernatural: "Übernatürlich", Thriller: "Thriller",
  },
  relation: {
    PARENT: "Hauptgeschichte", SIDE_STORY: "Nebengeschichte", SPIN_OFF: "Spin-off", ALTERNATIVE: "Alternative Fassung",
    SUMMARY: "Zusammenfassung", COMPILATION: "Kompilation", CONTAINS: "Enthält", CHARACTER: "Gleiche Figuren", OTHER: "Sonstiges",
  },
  sort: {
    relevance: "Beste Treffer", popular: "Beliebtheit", score: "Bewertung", trending: "Gerade angesagt", newest: "Neueste zuerst", oldest: "Älteste zuerst",
  },
  tagCategory: { Theme: "Themen", Cast: "Figuren", Setting: "Schauplatz", Demographic: "Zielgruppe", Technical: "Technisches" },
  part: { season: "Staffel {n}", series: "Serie", MOVIE: "Film", OVA: "OVA", SPECIAL: "Special", MUSIC: "Musikvideo", other: "Teil" },
};

export default labels;
