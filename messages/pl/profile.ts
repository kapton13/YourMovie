import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — profil w YourMovie",
  missing: {
    title: "Nie znaleziono użytkownika",
    text: "Nie ma użytkownika o nicku „{nickname}”. Być może nick został zmieniony.",
  },
  error: {
    title: "Nie udało się wczytać profilu",
    text: "Odśwież stronę za chwilę.",
    retry: "Spróbuj ponownie",
  },
  mediaFailed: "Nie udało się wczytać danych anime z AniList, więc godziny, gatunki i plakaty są na razie niedostępne.",
  closed: "🔒 Ten profil jest prywatny — {nickname} nie udostępnia swoich list.",
  since: "z nami od {date}",
  own: {
    public: "🌐 Profil publiczny — tę stronę widzi każdy, kto ma link.",
    private: "🔒 Profil prywatny — tylko ty widzisz swoje statystyki i listy.",
    copy: "Kopiuj link",
    copied: "Skopiowano ✓",
    settings: "Ustawienia",
  },
  tiles: {
    label: "Podsumowanie",
    anime: "anime na listach",
    episodes: "obejrzanych odcinków",
    hours: "godzin oglądania",
    hoursDays: "godzin ≈ {days} dni",
    average: "średnia ocena",
  },
  scores: {
    title: "Oceny",
    tip: "Ocena {score}: {count}",
    caption: "Ile anime otrzymało każdą ocenę od 1 do 10",
    empty: "Brak ocenionych anime.",
  },
  months: {
    title: "Odcinki według miesięcy",
    caption: "Ile odcinków oznaczono jako obejrzane w każdym miesiącu w ostatnim roku",
    footnote: "Według daty oznaczenia: „Cały sezon obejrzany” zapisuje wszystkie odcinki tego samego dnia.",
    empty: "W ostatnim roku nie oznaczono żadnych odcinków.",
  },
  genres: {
    title: "Ulubione gatunki",
    empty: "Gatunki pojawią się, gdy na twoich listach pojawią się anime oglądane lub obejrzane.",
  },
  lists: {
    title: "Listy",
    empty: "Ta lista jest na razie pusta.",
  },
  status: {
    watching: "Oglądam",
    planning: "Planuję",
    completed: "Obejrzane",
    paused: "Wstrzymane",
    dropped: "Porzucone",
  },
};

export default profile;
