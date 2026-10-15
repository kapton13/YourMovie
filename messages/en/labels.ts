export default {
  format: { TV: "TV series", TV_SHORT: "Short series", MOVIE: "Movie", SPECIAL: "Special", OVA: "OVA", ONA: "ONA", MUSIC: "Music video" } as Record<string, string>,
  season: { WINTER: "Winter", SPRING: "Spring", SUMMER: "Summer", FALL: "Fall" } as Record<string, string>,
  status: { FINISHED: "Finished", RELEASING: "Airing", NOT_YET_RELEASED: "Announced", CANCELLED: "Cancelled", HIATUS: "On hiatus" } as Record<string, string>,
  source: {
    ORIGINAL: "Original story", MANGA: "Manga", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Novel",
    VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Video game", GAME: "Game", WEB_MANGA: "Web manga", DOUJINSHI: "Doujinshi",
    ANIME: "Anime", LIVE_ACTION: "Live action", COMIC: "Comic", MULTIMEDIA_PROJECT: "Multimedia project",
    PICTURE_BOOK: "Picture book", BOOK: "Book", OTHER: "Other",
  } as Record<string, string>,
  country: { JP: "Japan", CN: "China", KR: "South Korea", TW: "Taiwan" } as Record<string, string>,
  genre: {
    Action: "Action", Adventure: "Adventure", Comedy: "Comedy", Drama: "Drama", Ecchi: "Ecchi", Fantasy: "Fantasy",
    Hentai: "Hentai", Horror: "Horror", "Mahou Shoujo": "Mahou Shoujo", Mecha: "Mecha", Music: "Music", Mystery: "Mystery",
    Psychological: "Psychological", Romance: "Romance", "Sci-Fi": "Sci-Fi", "Slice of Life": "Slice of Life",
    Sports: "Sports", Supernatural: "Supernatural", Thriller: "Thriller",
  } as Record<string, string>,
  relation: {
    PARENT: "Main story", SIDE_STORY: "Side story", SPIN_OFF: "Spin-off", ALTERNATIVE: "Alternative version",
    SUMMARY: "Summary", COMPILATION: "Compilation", CONTAINS: "Contains", CHARACTER: "Same characters", OTHER: "Other",
  } as Record<string, string>,
  sort: {
    relevance: "Best match", popular: "Popularity", score: "Score", trending: "Trending now", newest: "Newest first", oldest: "Oldest first",
  } as Record<string, string>,
  tagCategory: { Theme: "Themes", Cast: "Characters", Setting: "Setting", Demographic: "Audience", Technical: "Technical" } as Record<string, string>,
  part: { season: "Season {n}", series: "Series", MOVIE: "Movie", OVA: "OVA", SPECIAL: "Special", MUSIC: "Music video", other: "Part" } as Record<string, string>,
};
