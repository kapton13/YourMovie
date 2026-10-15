import type { Plural } from "@/lib/i18n/format";

const anime = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "Anime — YourMovie",
  loading: "Loading…",
  poster: "Poster: {title}",
  rating: {
    note: "Average score from AniList users",
    votes: { one: "rating", other: "ratings" } as Plural,
    none: "No score yet",
  },
  nextEpisode: "Episode {n} airs {date}",
  franchise: {
    root: "This anime has {n} parts. Your status and score apply to the whole anime.",
    partOf: "Part of {title}",
    quoted: "“{title}”",
    position: "({n} of {total})",
    extra: "extra",
  },
  description: {
    heading: "Description",
    empty: "No description yet.",
    englishNote: "The description is in English, as provided by AniList.",
    sourceNote: "Description: {source}.",
  },
  tags: "Tags",
  info: {
    format: "Format",
    episodes: "Episodes",
    duration: "Episode length",
    minutes: "{n} min",
    status: "Status",
    season: "Season",
    dates: "Aired",
    studio: "Studio",
    source: "Source",
    country: "Country",
    popularity: "Added to lists",
    anilistPage: "AniList page ↗",
  },
  watchOrder: "Watch order",
  announced: "TBA",
  related: "Related",
  similar: "Similar anime",
};

export default anime;
