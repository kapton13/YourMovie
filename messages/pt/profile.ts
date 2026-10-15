import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — perfil no YourMovie",
  missing: {
    title: "Usuário não encontrado",
    text: "Não há nenhum usuário com o apelido “{nickname}”. Talvez ele tenha sido alterado.",
  },
  error: {
    title: "Não foi possível carregar o perfil",
    text: "Atualize a página daqui a pouco.",
  },
  closed: "🔒 Este perfil é privado — {nickname} não compartilha suas listas.",
  since: "membro desde {date}",
  own: {
    public: "🌐 Perfil público — qualquer pessoa com o link pode ver esta página.",
    private: "🔒 Perfil privado — só você pode ver suas estatísticas e listas.",
    copy: "Copiar link",
    copied: "Copiado ✓",
    settings: "Configurações",
  },
  tiles: {
    label: "Resumo",
    anime: "animes nas listas",
    episodes: "episódios assistidos",
    hours: "horas assistidas",
    hoursDays: "horas ≈ {days} dias",
    average: "nota média",
  },
  scores: {
    title: "Notas",
    tip: "Nota {score}: {count}",
    caption: "Quantos animes receberam cada nota de 1 a 10",
    empty: "Ainda não há animes com nota.",
  },
  months: {
    title: "Episódios por mês",
    caption: "Quantos episódios foram marcados como assistidos em cada mês do último ano",
    footnote: "Pela data da marcação: “Assisti à temporada inteira” registra todos os episódios no mesmo dia.",
    empty: "Nenhum episódio marcado no último ano.",
  },
  genres: {
    title: "Gêneros favoritos",
    empty: "Os gêneros aparecerão quando suas listas tiverem animes que você está assistindo ou já assistiu.",
  },
  lists: {
    title: "Listas",
    empty: "Esta lista está vazia por enquanto.",
  },
  status: {
    watching: "Assistindo",
    planning: "Quero assistir",
    completed: "Assistido",
    paused: "Em pausa",
    dropped: "Abandonado",
  },
};

export default profile;
