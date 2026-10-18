import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "Anime takipçisi: katalog, kişisel listeler ve öneriler.",
  siteTitle: "YourMovie — anime takipçisi",
  nav: {
    home: "Ana sayfa",
    catalog: "Katalog",
    myAnime: "Animelerim",
    recommendations: "Öneriler",
    login: "Giriş yap",
    myProfile: "Profilim ({name})",
  },
  theme: { toggle: "Gündüz / gece temasını değiştir" },
  language: { label: "Site dili", choose: "Dil" },
  footer: { dataBy: "Anime verileri: {source}.", shikimori: "Rusça adlar ve açıklamalar: {source}." },
  notFound: {
    title: "Sayfa bulunamadı",
    text: "Bağlantı eskimiş ya da yazım hatası içeriyor olabilir.",
    home: "Ana sayfaya git",
    animeTitle: "Anime bulunamadı",
    animeText: "Bağlantı eskimiş olabilir.",
    toCatalog: "Kataloğa git",
  },
  anilistError: "AniList’ten veriler yüklenemedi. Biraz sonra sayfayı yenile.",
  tooMany: { title: "Çok fazla istek", text: "Çok hızlı arama yapıyorsun. Bir dakika bekleyip tekrar dene." },
  saveError: "Kaydedilemedi. Bağlantını kontrol edip tekrar dene.",
  loading: "Yükleniyor…",
  untitled: "Adsız",
  yes: "Evet",
  no: "Hayır",
  cancel: "İptal",
  close: "Kapat",
  done: "Tamam",
  episodes: { one: "bölüm", other: "bölüm" },
  anime: { one: "anime", other: "anime" },
};

export default common;
