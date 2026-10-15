import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Tracker de anime: catálogo, listas personales y recomendaciones.",
  siteTitle: "YourMovie — tracker de anime",
  nav: {
    home: "Inicio",
    catalog: "Catálogo",
    myAnime: "Mis animes",
    recommendations: "Recomendaciones",
    login: "Iniciar sesión",
    myProfile: "Mi perfil ({name})",
  },
  theme: { toggle: "Cambiar entre tema claro y oscuro" },
  language: { label: "Idioma del sitio", choose: "Idioma" },
  footer: { dataBy: "Datos de anime proporcionados por {source}.", shikimori: "Títulos y descripciones en ruso: {source}." },
  notFound: {
    title: "Página no encontrada",
    text: "Puede que el enlace esté desactualizado o tenga un error.",
    home: "Ir al inicio",
    animeTitle: "Anime no encontrado",
    animeText: "Puede que el enlace esté desactualizado.",
    toCatalog: "Ir al catálogo",
  },
  anilistError: "No se pudieron cargar los datos de AniList. Actualiza la página en un rato.",
  saveError: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.",
  loading: "Cargando…",
  untitled: "Sin título",
  yes: "Sí",
  no: "No",
  cancel: "Cancelar",
  close: "Cerrar",
  done: "Listo",
  episodes: { one: "episodio", other: "episodios" },
  anime: { one: "anime", other: "animes" },
};

export default common;
