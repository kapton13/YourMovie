import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Recomendações — YourMovie",
  title: "Recomendações",
  forYou: "Para você",
  guest: "{link} e escolheremos animes com base nas suas listas e notas.",
  guestLink: "Entre",
  loading: "Escolhendo animes com base nas suas listas e notas…",
  error: "Não foi possível carregar as recomendações. Atualize a página daqui a pouco.",
  lead: "Escolhidos com base em {count} das suas listas e nas suas notas. Os mais compatíveis aparecem primeiro.",
  leadEmpty: "Ainda sabemos pouco sobre o seu gosto, então aqui está o que é popular.",
  hint: "Adicione às suas listas pelo menos 3 animes que você já assistiu e dê notas a eles para receber recomendações mais precisas.",
  toCatalog: "Ir para o catálogo →",
  filters: {
    kind: "Tipo",
    airing: "Status",
    genre: "Gênero",
    allGenres: "Todos os gêneros",
    kinds: { all: "Todos", series: "Séries", movies: "Filmes" },
    airingOptions: { all: "Todos", finished: "Finalizados", releasing: "Em exibição" },
  },
  more: "Mostrar mais",
  noResults: "Nada corresponde a esses filtros. Tente outros.",
  reason: {
    rated: "Porque você deu {score}/10 para “{title}”",
    similarOne: "Parecido com “{title}”",
    similarTwo: "Parecido com “{first}” e “{second}”",
    popular: "Popular no AniList",
  },
};

export default recs;
