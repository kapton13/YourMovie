import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Rastreador de anime: catálogo, listas pessoais e recomendações.",
  siteTitle: "YourMovie — rastreador de anime",
  nav: {
    home: "Início",
    catalog: "Catálogo",
    myAnime: "Meus animes",
    recommendations: "Recomendações",
    login: "Entrar",
    myProfile: "Meu perfil ({name})",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "{n} anime com episódios novos", other: "{n} animes com episódios novos" },
  },
  theme: { toggle: "Alternar tema claro / escuro" },
  language: { label: "Idioma do site", choose: "Idioma" },
  footer: { dataBy: "Dados de anime fornecidos por {source}.", shikimori: "Títulos e descrições em russo: {source}." },
  notFound: {
    title: "Página não encontrada",
    text: "O link pode estar desatualizado ou conter um erro de digitação.",
    home: "Ir para o início",
    animeTitle: "Anime não encontrado",
    animeText: "O link pode estar desatualizado.",
    toCatalog: "Ir para o catálogo",
  },
  anilistError: "Não foi possível carregar os dados do AniList. Atualize a página daqui a pouco.",
  tooMany: { title: "Muitas solicitações", text: "Você está pesquisando muito rápido. Aguarde um minuto e tente de novo." },
  saveError: "Não foi possível salvar. Verifique sua conexão e tente de novo.",
  loading: "Carregando…",
  untitled: "Sem título",
  yes: "Sim",
  no: "Não",
  cancel: "Cancelar",
  retry: "Tentar de novo",
  close: "Fechar",
  done: "Pronto",
  episodes: { one: "episódio", other: "episódios" },
  anime: { one: "anime", other: "animes" },
};

export default common;
