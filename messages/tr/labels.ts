import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "TV dizisi", TV_SHORT: "Kısa dizi", MOVIE: "Film", SPECIAL: "Özel bölüm", OVA: "OVA", ONA: "ONA", MUSIC: "Müzik videosu" },
  season: { WINTER: "Kış", SPRING: "İlkbahar", SUMMER: "Yaz", FALL: "Sonbahar" },
  status: { FINISHED: "Yayını bitti", RELEASING: "Yayında", NOT_YET_RELEASED: "Duyuruldu", CANCELLED: "İptal edildi", HIATUS: "Ara verildi" },
  source: {
    ORIGINAL: "Orijinal hikâye", MANGA: "Manga", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Roman",
    VISUAL_NOVEL: "Görsel roman", VIDEO_GAME: "Video oyunu", GAME: "Oyun", WEB_MANGA: "Web manga", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Canlı çekim", COMIC: "Çizgi roman", MULTIMEDIA_PROJECT: "Multimedya projesi",
    PICTURE_BOOK: "Resimli kitap", BOOK: "Kitap", OTHER: "Diğer",
  },
  country: { JP: "Japonya", CN: "Çin", KR: "Güney Kore", TW: "Tayvan" },
  genre: {
    Action: "Aksiyon", Adventure: "Macera", Comedy: "Komedi", Drama: "Dram", Ecchi: "Ecchi", Fantasy: "Fantastik",
    Hentai: "Hentai", Horror: "Korku", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Müzik", Mystery: "Gizem",
    Psychological: "Psikolojik", Romance: "Romantik", "Sci-Fi": "Bilim kurgu", "Slice of Life": "Gündelik yaşam",
    Sports: "Spor", Supernatural: "Doğaüstü", Thriller: "Gerilim",
  },
  relation: {
    PARENT: "Ana hikâye", SIDE_STORY: "Yan hikâye", SPIN_OFF: "Spin-off", ALTERNATIVE: "Alternatif versiyon",
    SUMMARY: "Özet", COMPILATION: "Derleme", CONTAINS: "İçerir", CHARACTER: "Aynı karakterler", OTHER: "Diğer",
  },
  sort: {
    relevance: "En iyi eşleşme", popular: "Popülerlik", score: "Puan", trending: "Şu an trend", newest: "Önce en yeni", oldest: "Önce en eski",
  },
  tagCategory: { Theme: "Temalar", Cast: "Karakterler", Setting: "Ortam", Demographic: "Hedef kitle", Technical: "Teknik" },
  part: { season: "{n}. sezon", series: "Dizi", MOVIE: "Film", OVA: "OVA", SPECIAL: "Özel bölüm", MUSIC: "Müzik videosu", other: "Kısım" },
};

export default labels;
