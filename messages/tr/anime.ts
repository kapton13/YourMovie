import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Yükleniyor…",
  poster: "Afiş: {title}",
  rating: {
    note: "AniList kullanıcılarının ortalama puanı",
    votes: { one: "oy", other: "oy" },
    none: "Henüz puan yok",
  },
  nextEpisode: "{n}. bölüm {date} tarihinde yayınlanacak",
  franchise: {
    root: "Bu anime {n} kısımdan oluşuyor. Durumun ve puanın animenin tamamı için geçerli.",
    partOf: "{title} serisinin parçası",
    quoted: "“{title}”",
    position: "({n}/{total})",
    extra: "ek",
  },
  description: {
    heading: "Açıklama",
    empty: "Henüz açıklama yok.",
    englishNote: "Açıklama, AniList’te olduğu gibi İngilizcedir.",
    sourceNote: "Açıklama: {source}.",
  },
  tags: "Etiketler",
  info: {
    format: "Format",
    episodes: "Bölümler",
    duration: "Bölüm süresi",
    minutes: "{n} dk",
    status: "Durum",
    season: "Sezon",
    dates: "Yayın tarihleri",
    studio: "Stüdyo",
    source: "Kaynak",
    country: "Ülke",
    popularity: "Listelere eklenme",
    anilistPage: "AniList sayfası ↗",
  },
  watchOrder: "İzleme sırası",
  announced: "Belli değil",
  related: "İlişkili",
  similar: "Benzer animeler",
};

export default anime;
