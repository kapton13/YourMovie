import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Wird geladen…",
  poster: "Poster: {title}",
  rating: {
    note: "Durchschnittliche Bewertung der AniList-Nutzer",
    votes: { one: "Bewertung", other: "Bewertungen" },
    none: "Noch keine Bewertung",
  },
  nextEpisode: "Folge {n} erscheint am {date}",
  franchise: {
    root: "Dieser Anime besteht aus {n} Teilen. Dein Status und deine Bewertung gelten für den ganzen Anime.",
    partOf: "Teil von {title}",
    quoted: "„{title}“",
    position: "({n} von {total})",
    extra: "Extra",
  },
  description: {
    heading: "Beschreibung",
    empty: "Noch keine Beschreibung.",
    englishNote: "Die Beschreibung ist auf Englisch, so wie AniList sie bereitstellt.",
    sourceNote: "Beschreibung: {source}.",
  },
  tags: "Tags",
  info: {
    format: "Format",
    episodes: "Folgen",
    duration: "Folgenlänge",
    minutes: "{n} Min.",
    status: "Status",
    season: "Season",
    dates: "Ausstrahlung",
    studio: "Studio",
    source: "Vorlage",
    country: "Land",
    popularity: "In Listen hinzugefügt",
    anilistPage: "Seite auf AniList ↗",
  },
  watchOrder: "Reihenfolge zum Schauen",
  announced: "Noch offen",
  related: "Verwandt",
  similar: "Ähnliche Anime",
};

export default anime;
