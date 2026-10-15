const profile = {
  metaTitle: "{nickname} — profile on YourMovie",
  missing: {
    title: "User not found",
    text: "There’s no user with the nickname “{nickname}”. They may have changed it.",
  },
  error: {
    title: "Couldn’t load the profile",
    text: "Please refresh the page a little later.",
    retry: "Try again",
  },
  mediaFailed: "Couldn’t load anime details from AniList, so hours, genres and posters are missing for now.",
  closed: "🔒 This profile is private — {nickname} doesn’t share their lists.",
  since: "member since {date}",
  own: {
    public: "🌐 Public profile — anyone with the link can see this page.",
    private: "🔒 Private profile — only you can see your stats and lists.",
    copy: "Copy link",
    copied: "Copied ✓",
    settings: "Settings",
  },
  tiles: {
    label: "Summary",
    anime: "anime in lists",
    episodes: "episodes watched",
    hours: "hours watched",
    hoursDays: "hours ≈ {days} days",
    average: "average score",
  },
  scores: {
    title: "Scores",
    tip: "Score {score}: {count}",
    caption: "How many anime got each score from 1 to 10",
    empty: "No scored anime yet.",
  },
  months: {
    title: "Episodes by month",
    caption: "How many episodes were marked as watched each month over the past year",
    footnote: "By the date of the mark: “Watched the whole season” records all episodes on the same day.",
    empty: "No episodes marked in the past year.",
  },
  genres: {
    title: "Favorite genres",
    empty: "Genres will appear once your lists have anime you’re watching or have watched.",
  },
  lists: {
    title: "Lists",
    empty: "This list is empty for now.",
  },
  status: {
    watching: "Watching",
    planning: "Planning",
    completed: "Completed",
    paused: "On hold",
    dropped: "Dropped",
  } as Record<string, string>,
};

export default profile;
