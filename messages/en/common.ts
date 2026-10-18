import type { Plural } from "@/lib/i18n/format";

const common = {
  siteDescription: "Anime tracker: catalog, personal lists and recommendations.",
  siteTitle: "YourMovie — anime tracker",
  nav: {
    home: "Home",
    catalog: "Catalog",
    myAnime: "My anime",
    recommendations: "Recommendations",
    login: "Log in",
    myProfile: "My profile ({name})",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "{n} anime with new episodes", other: "{n} anime with new episodes" } as Plural,
  },
  theme: { toggle: "Switch day / night theme" },
  language: { label: "Site language", choose: "Language" },
  footer: { dataBy: "Anime data provided by {source}.", shikimori: "Russian titles and descriptions: {source}." },
  notFound: {
    title: "Page not found",
    text: "The link may be outdated or contain a typo.",
    home: "Go to the home page",
    animeTitle: "Anime not found",
    animeText: "The link may be outdated.",
    toCatalog: "Go to the catalog",
  },
  anilistError: "Couldn’t load data from AniList. Please refresh the page a little later.",
  tooMany: { title: "Too many requests", text: "You’re searching very fast. Please wait a minute and try again." },
  saveError: "Couldn’t save. Check your connection and try again.",
  loading: "Loading…",
  untitled: "Untitled",
  yes: "Yes",
  no: "No",
  cancel: "Cancel",
  retry: "Try again",
  close: "Close",
  done: "Done",
  episodes: { one: "episode", other: "episodes" } as Plural,
  anime: { one: "anime", other: "anime" } as Plural,
};

export default common;
