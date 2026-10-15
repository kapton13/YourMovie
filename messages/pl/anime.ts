import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Ładowanie…",
  poster: "Plakat: {title}",
  rating: {
    note: "Średnia ocena użytkowników AniList",
    votes: { one: "ocena", few: "oceny", many: "ocen", other: "oceny" },
    none: "Brak ocen",
  },
  nextEpisode: "Odcinek {n} wyjdzie {date}",
  franchise: {
    root: "To anime składa się z kilku części: {n}. Twój status i ocena dotyczą całego anime.",
    partOf: "Część anime {title}",
    quoted: "„{title}”",
    position: "({n} z {total})",
    extra: "dodatek",
  },
  description: {
    heading: "Opis",
    empty: "Brak opisu.",
    englishNote: "Opis jest po angielsku, tak jak udostępnia go AniList.",
    sourceNote: "Opis: {source}.",
  },
  tags: "Tagi",
  info: {
    format: "Format",
    episodes: "Odcinki",
    duration: "Długość odcinka",
    minutes: "{n} min",
    status: "Status",
    season: "Sezon",
    dates: "Emisja",
    studio: "Studio",
    source: "Pierwowzór",
    country: "Kraj",
    popularity: "Dodano do list",
    anilistPage: "Strona na AniList ↗",
  },
  watchOrder: "Kolejność oglądania",
  announced: "Zapowiedź",
  related: "Powiązane",
  similar: "Podobne anime",
};

export default anime;
