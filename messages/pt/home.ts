import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Descubra animes",
    text: "O que estão assistindo agora, o que está passando nesta temporada e o que todo mundo deveria ver.",
  },
  loading: "Carregando sugestões…",
  trending: "Em alta agora",
  currentSeason: "Nesta temporada: {season}",
  seasonName: "{season} de {year}",
  popular: "Populares de todos os tempos",
  top: "Mais bem avaliados",
  search: {
    placeholder: "Título do anime…",
    label: "Buscar anime pelo título",
    submit: "Buscar",
    advanced: "Busca avançada: gêneros, anos, formato e mais filtros →",
  },
  row: {
    seeAll: "Ver tudo →",
    empty: "Nada por aqui ainda.",
  },
  card: {
    score: "Nota {score} de 10",
    here: "Você está aqui",
  },
};

export default home;
