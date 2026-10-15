import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — Profil auf YourMovie",
  missing: {
    title: "Nutzer nicht gefunden",
    text: "Es gibt keinen Nutzer mit dem Nickname „{nickname}“. Vielleicht wurde er geändert.",
  },
  error: {
    title: "Das Profil konnte nicht geladen werden",
    text: "Lade die Seite bitte etwas später neu.",
    retry: "Erneut versuchen",
  },
  mediaFailed: "Die Anime-Daten von AniList konnten nicht geladen werden – Stunden, Genres und Poster fehlen vorerst.",
  closed: "🔒 Dieses Profil ist privat — {nickname} teilt die eigenen Listen nicht.",
  since: "dabei seit dem {date}",
  own: {
    public: "🌐 Öffentliches Profil — alle mit dem Link können diese Seite sehen.",
    private: "🔒 Privates Profil — nur du siehst deine Statistiken und Listen.",
    copy: "Link kopieren",
    copied: "Kopiert ✓",
    settings: "Einstellungen",
  },
  tiles: {
    label: "Übersicht",
    anime: "Anime in Listen",
    episodes: "gesehene Folgen",
    hours: "Stunden geschaut",
    hoursDays: "Stunden ≈ {days} Tage",
    average: "Durchschnittsbewertung",
  },
  scores: {
    title: "Bewertungen",
    tip: "Bewertung {score}: {count}",
    caption: "Wie viele Anime welche Bewertung von 1 bis 10 bekommen haben",
    empty: "Noch keine bewerteten Anime.",
  },
  months: {
    title: "Folgen pro Monat",
    caption: "Wie viele Folgen im letzten Jahr pro Monat als gesehen abgehakt wurden",
    footnote: "Nach dem Datum des Häkchens: „Ganze Staffel gesehen“ trägt alle Folgen am selben Tag ein.",
    empty: "Im letzten Jahr wurden keine Folgen abgehakt.",
  },
  genres: {
    title: "Lieblingsgenres",
    empty: "Genres erscheinen, sobald in deinen Listen Anime stehen, die du schaust oder gesehen hast.",
  },
  lists: {
    title: "Listen",
    empty: "Diese Liste ist noch leer.",
  },
  status: {
    watching: "Schaue ich",
    planning: "Geplant",
    completed: "Gesehen",
    paused: "Pausiert",
    dropped: "Abgebrochen",
  },
};

export default profile;
