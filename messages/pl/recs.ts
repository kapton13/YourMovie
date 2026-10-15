import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Rekomendacje — YourMovie",
  title: "Rekomendacje",
  forYou: "Dla ciebie",
  guest: "{link}, a dobierzemy anime na podstawie twoich list i ocen.",
  guestLink: "Zaloguj się",
  loading: "Dobieramy anime na podstawie twoich list i ocen…",
  error: "Nie udało się wczytać rekomendacji. Odśwież stronę za chwilę.",
  lead: "Dobrane na podstawie {count} z twoich list i twoich ocen. Najlepiej dopasowane są na górze.",
  leadEmpty: "Nie wiemy jeszcze wiele o twoim guście, więc pokazujemy to, co popularne.",
  hint: "Dodaj do list co najmniej 3 obejrzane anime i je oceń, a rekomendacje będą trafniejsze.",
  toCatalog: "Przejdź do katalogu →",
  filters: {
    kind: "Typ",
    airing: "Status",
    genre: "Gatunek",
    allGenres: "Wszystkie gatunki",
    kinds: { all: "Wszystkie", series: "Seriale", movies: "Filmy" },
    airingOptions: { all: "Wszystkie", finished: "Zakończone", releasing: "Emitowane teraz" },
  },
  more: "Pokaż więcej",
  noResults: "Nic nie pasuje do tych filtrów. Spróbuj innych.",
  reason: {
    rated: "Bo oceniono „{title}” na {score}/10",
    similarOne: "Podobne do „{title}”",
    similarTwo: "Podobne do „{first}” i „{second}”",
    popular: "Popularne na AniList",
  },
};

export default recs;
