import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Recomendaciones — YourMovie",
  title: "Recomendaciones",
  forYou: "Para ti",
  guest: "{link} y elegiremos animes según tus listas y puntuaciones.",
  guestLink: "Inicia sesión",
  loading: "Eligiendo animes según tus listas y puntuaciones…",
  error: "No se pudieron cargar las recomendaciones. Actualiza la página en un rato.",
  lead: "Elegidos a partir de {count} de tus listas y de tus puntuaciones. Primero, los que mejor encajan.",
  leadEmpty: "Aún no conocemos bien tus gustos, así que esto es lo más popular.",
  hint: "Añade a tus listas al menos 3 animes que hayas visto y puntúalos para recibir recomendaciones más precisas.",
  toCatalog: "Ir al catálogo →",
  filters: {
    kind: "Tipo",
    airing: "Estado",
    genre: "Género",
    allGenres: "Todos los géneros",
    kinds: { all: "Todo", series: "Series", movies: "Películas" },
    airingOptions: { all: "Todo", finished: "Finalizados", releasing: "En emisión" },
  },
  more: "Mostrar más",
  noResults: "Nada coincide con estos filtros. Prueba con otros.",
  reason: {
    rated: "Porque le diste un {score}/10 a «{title}»",
    similarOne: "Similar a «{title}»",
    similarTwo: "Similar a «{first}» y «{second}»",
    popular: "Popular en AniList",
  },
};

export default recs;
