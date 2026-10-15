import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "Anime keşfet",
    text: "Şu an ne izleniyor, bu sezon neler yayında ve herkesin mutlaka izlemesi gerekenler.",
  },
  loading: "Seçkiler yükleniyor…",
  trending: "Şu an trend",
  currentSeason: "Bu sezon: {season}",
  seasonName: "{season} {year}",
  popular: "Tüm zamanların en popülerleri",
  top: "En yüksek puanlılar",
  search: {
    placeholder: "Anime adı…",
    label: "Animeyi adına göre ara",
    submit: "Ara",
    advanced: "Gelişmiş arama: türler, yıllar, format ve diğer filtreler →",
  },
  row: {
    seeAll: "Tümünü gör →",
    empty: "Burada henüz bir şey yok.",
  },
  card: {
    score: "10 üzerinden {score} puan",
    here: "Buradasın",
  },
};

export default home;
