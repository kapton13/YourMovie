import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — YourMovie profili",
  missing: {
    title: "Kullanıcı bulunamadı",
    text: "“{nickname}” takma adlı bir kullanıcı yok. Takma adını değiştirmiş olabilir.",
  },
  error: {
    title: "Profil yüklenemedi",
    text: "Biraz sonra sayfayı yenile.",
  },
  closed: "🔒 Bu profil gizli — {nickname} listelerini paylaşmıyor.",
  since: "{date} tarihinden beri üye",
  own: {
    public: "🌐 Herkese açık profil — bağlantıya sahip herkes bu sayfayı görebilir.",
    private: "🔒 Gizli profil — istatistiklerini ve listelerini yalnızca sen görebilirsin.",
    copy: "Bağlantıyı kopyala",
    copied: "Kopyalandı ✓",
    settings: "Ayarlar",
  },
  tiles: {
    label: "Özet",
    anime: "listelerdeki anime",
    episodes: "izlenen bölüm",
    hours: "saat izleme",
    hoursDays: "saat ≈ {days} gün",
    average: "ortalama puan",
  },
  scores: {
    title: "Puanlar",
    tip: "{score} puan: {count}",
    caption: "1’den 10’a kadar her puanı kaç anime aldı",
    empty: "Henüz puanlanmış anime yok.",
  },
  months: {
    title: "Aylara göre bölümler",
    caption: "Son bir yılda her ay kaç bölüm izlendi olarak işaretlendi",
    footnote: "İşaretleme tarihine göre: “Tüm sezonu izledim” tüm bölümleri aynı güne kaydeder.",
    empty: "Son bir yılda işaretlenmiş bölüm yok.",
  },
  genres: {
    title: "Favori türler",
    empty: "Listelerde izlenen ya da izlenmiş animeler olunca türler burada görünecek.",
  },
  lists: {
    title: "Listeler",
    empty: "Bu liste şimdilik boş.",
  },
  status: {
    watching: "İzleniyor",
    planning: "İzlenecek",
    completed: "Tamamlandı",
    paused: "Beklemede",
    dropped: "Bırakıldı",
  },
};

export default profile;
