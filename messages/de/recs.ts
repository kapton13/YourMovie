import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Empfehlungen — YourMovie",
  title: "Empfehlungen",
  forYou: "Für dich",
  guest: "{link}, dann suchen wir Anime passend zu deinen Listen und Bewertungen aus.",
  guestLink: "Melde dich an",
  loading: "Wir suchen Anime passend zu deinen Listen und Bewertungen aus…",
  error: "Die Empfehlungen konnten nicht geladen werden. Lade die Seite bitte etwas später neu.",
  lead: "Ausgewählt anhand von {count} aus deinen Listen und deinen Bewertungen. Die besten Treffer stehen oben.",
  leadEmpty: "Wir kennen deinen Geschmack noch kaum, deshalb zeigen wir dir, was gerade beliebt ist.",
  hint: "Füge mindestens 3 gesehene Anime zu deinen Listen hinzu und bewerte sie, um genauere Empfehlungen zu bekommen.",
  toCatalog: "Zum Katalog →",
  filters: {
    kind: "Typ",
    airing: "Status",
    genre: "Genre",
    allGenres: "Alle Genres",
    kinds: { all: "Alle", series: "Serien", movies: "Filme" },
    airingOptions: { all: "Alle", finished: "Abgeschlossen", releasing: "Läuft gerade" },
  },
  more: "Mehr anzeigen",
  noResults: "Zu diesen Filtern passt nichts. Probier andere aus.",
  reason: {
    rated: "Weil du „{title}“ mit {score}/10 bewertet hast",
    similarOne: "Ähnlich wie „{title}“",
    similarTwo: "Ähnlich wie „{first}“ und „{second}“",
    popular: "Beliebt auf AniList",
  },
};

export default recs;
