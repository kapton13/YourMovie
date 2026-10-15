import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "Öneriler — YourMovie",
  title: "Öneriler",
  forYou: "Sana özel",
  guest: "{link}, listelerine ve puanlarına göre sana anime seçelim.",
  guestLink: "Giriş yap",
  loading: "Listelerine ve puanlarına göre anime seçiliyor…",
  error: "Öneriler yüklenemedi. Biraz sonra sayfayı yenile.",
  lead: "Listelerindeki {count} ve puanların temel alınarak seçildi. En iyi eşleşmeler en üstte.",
  leadEmpty: "Zevkin hakkında henüz pek bir şey bilmiyoruz, bu yüzden popüler olanları gösteriyoruz.",
  hint: "Daha isabetli öneriler için listelerine izlediğin en az 3 anime ekle ve puanla.",
  toCatalog: "Kataloğa git →",
  filters: {
    kind: "Tip",
    airing: "Durum",
    genre: "Tür",
    allGenres: "Tüm türler",
    kinds: { all: "Tümü", series: "Diziler", movies: "Filmler" },
    airingOptions: { all: "Tümü", finished: "Yayını bitti", releasing: "Şu an yayında" },
  },
  more: "Daha fazla göster",
  noResults: "Bu filtrelere uyan bir şey yok. Başka filtreler dene.",
  reason: {
    rated: "“{title}” animesine {score}/10 verdiğin için",
    similarOne: "“{title}” animesine benzer",
    similarTwo: "“{first}” ve “{second}” animelerine benzer",
    popular: "AniList’te popüler",
  },
};

export default recs;
