import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Descubre anime",
    text: "Lo que la gente está viendo ahora, lo que se emite esta temporada y lo que todo el mundo debería ver.",
  },
  loading: "Cargando sugerencias…",
  trending: "Tendencia ahora",
  currentSeason: "Esta temporada: {season}",
  seasonName: "{season} {year}",
  popular: "Los más populares de siempre",
  top: "Mejor puntuados",
  search: {
    placeholder: "Título del anime…",
    label: "Buscar anime por título",
    submit: "Buscar",
    advanced: "Búsqueda avanzada: géneros, años, formato y más filtros →",
  },
  row: {
    seeAll: "Ver todo →",
    empty: "Aún no hay nada aquí.",
  },
  card: {
    score: "Puntuación: {score} de 10",
    here: "Estás aquí",
  },
};

export default home;
