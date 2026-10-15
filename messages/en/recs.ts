const recs = {
  metaTitle: "Recommendations — YourMovie",
  title: "Recommendations",
  forYou: "For you",
  guest: "{link} and we’ll pick anime based on your lists and scores.",
  guestLink: "Log in",
  loading: "Picking anime based on your lists and scores…",
  error: "Couldn’t load recommendations. Please refresh the page a little later.",
  lead: "Picked based on {count} from your lists and your scores. Best matches come first.",
  leadEmpty: "We don’t know much about your taste yet, so here’s what’s popular.",
  hint: "Add at least 3 anime you’ve watched to your lists and score them to get more accurate recommendations.",
  toCatalog: "Go to the catalog →",
  filters: {
    kind: "Type",
    airing: "Status",
    genre: "Genre",
    allGenres: "All genres",
    kinds: { all: "All", series: "Series", movies: "Movies" } as Record<string, string>,
    airingOptions: { all: "All", finished: "Finished", releasing: "Airing now" } as Record<string, string>,
  },
  more: "Show more",
  noResults: "Nothing matches these filters. Try different ones.",
  reason: {
    rated: "Because you rated “{title}” {score}/10",
    similarOne: "Similar to “{title}”",
    similarTwo: "Similar to “{first}” and “{second}”",
    popular: "Popular on AniList",
  },
};

export default recs;
