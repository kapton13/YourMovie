import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Anime-Tracker: Katalog, persönliche Listen und Empfehlungen.",
  siteTitle: "YourMovie — Anime-Tracker",
  nav: {
    home: "Start",
    catalog: "Katalog",
    myAnime: "Meine Anime",
    recommendations: "Empfehlungen",
    login: "Anmelden",
    myProfile: "Mein Profil ({name})",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "{n} Anime mit neuen Folgen", other: "{n} Anime mit neuen Folgen" },
  },
  theme: { toggle: "Zwischen hellem und dunklem Design wechseln" },
  language: { label: "Sprache der Website", choose: "Sprache" },
  footer: { dataBy: "Anime-Daten stammen von {source}.", shikimori: "Russische Titel und Beschreibungen: {source}." },
  notFound: {
    title: "Seite nicht gefunden",
    text: "Der Link ist vielleicht veraltet oder enthält einen Tippfehler.",
    home: "Zur Startseite",
    animeTitle: "Anime nicht gefunden",
    animeText: "Der Link ist vielleicht veraltet.",
    toCatalog: "Zum Katalog",
  },
  anilistError: "Die Daten von AniList konnten nicht geladen werden. Lade die Seite bitte etwas später neu.",
  tooMany: { title: "Zu viele Anfragen", text: "Du suchst sehr schnell. Warte eine Minute und versuche es dann erneut." },
  saveError: "Speichern fehlgeschlagen. Prüfe deine Verbindung und versuch es noch einmal.",
  loading: "Wird geladen…",
  untitled: "Ohne Titel",
  yes: "Ja",
  no: "Nein",
  cancel: "Abbrechen",
  retry: "Erneut versuchen",
  close: "Schließen",
  done: "Fertig",
  episodes: { one: "Folge", other: "Folgen" },
  anime: { one: "Anime", other: "Anime" },
};

export default common;
