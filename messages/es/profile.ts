import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — perfil en YourMovie",
  missing: {
    title: "Usuario no encontrado",
    text: "No hay ningún usuario con el nombre «{nickname}». Puede que lo haya cambiado.",
  },
  error: {
    title: "No se pudo cargar el perfil",
    text: "Actualiza la página en un rato.",
  },
  closed: "🔒 Este perfil es privado: {nickname} no comparte sus listas.",
  since: "miembro desde el {date}",
  own: {
    public: "🌐 Perfil público: cualquiera con el enlace puede ver esta página.",
    private: "🔒 Perfil privado: solo tú puedes ver tus estadísticas y listas.",
    copy: "Copiar enlace",
    copied: "Copiado ✓",
    settings: "Ajustes",
  },
  tiles: {
    label: "Resumen",
    anime: "animes en listas",
    episodes: "episodios vistos",
    hours: "horas vistas",
    hoursDays: "horas ≈ {days} días",
    average: "puntuación media",
  },
  scores: {
    title: "Puntuaciones",
    tip: "Puntuación {score}: {count}",
    caption: "Cuántos animes recibieron cada puntuación del 1 al 10",
    empty: "Aún no hay animes puntuados.",
  },
  months: {
    title: "Episodios por mes",
    caption: "Cuántos episodios se marcaron como vistos cada mes durante el último año",
    footnote: "Según la fecha en que se marcaron: «Vi toda la temporada» registra todos los episodios el mismo día.",
    empty: "No se marcó ningún episodio en el último año.",
  },
  genres: {
    title: "Géneros favoritos",
    empty: "Los géneros aparecerán cuando tus listas tengan animes que estés viendo o que ya hayas visto.",
  },
  lists: {
    title: "Listas",
    empty: "Esta lista está vacía por ahora.",
  },
  status: {
    watching: "Viendo",
    planning: "Pendiente",
    completed: "Completado",
    paused: "En pausa",
    dropped: "Abandonado",
  },
};

export default profile;
