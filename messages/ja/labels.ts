import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "TVアニメ", TV_SHORT: "TVショート", MOVIE: "劇場版", SPECIAL: "特別編", OVA: "OVA", ONA: "ONA", MUSIC: "MV" },
  season: { WINTER: "冬", SPRING: "春", SUMMER: "夏", FALL: "秋" },
  status: { FINISHED: "放送終了", RELEASING: "放送中", NOT_YET_RELEASED: "放送予定", CANCELLED: "制作中止", HIATUS: "休止中" },
  source: {
    ORIGINAL: "オリジナル", MANGA: "漫画", LIGHT_NOVEL: "ライトノベル", WEB_NOVEL: "Web小説", NOVEL: "小説",
    VISUAL_NOVEL: "ビジュアルノベル", VIDEO_GAME: "ゲーム", GAME: "ゲーム", WEB_MANGA: "Web漫画", DOUJINSHI: "同人誌",
    ANIME: "アニメ", LIVE_ACTION: "実写", COMIC: "コミック", MULTIMEDIA_PROJECT: "メディアミックス",
    PICTURE_BOOK: "絵本", BOOK: "書籍", OTHER: "その他",
  },
  country: { JP: "日本", CN: "中国", KR: "韓国", TW: "台湾" },
  genre: {
    Action: "アクション", Adventure: "冒険", Comedy: "コメディ", Drama: "ドラマ", Ecchi: "エッチ", Fantasy: "ファンタジー",
    Hentai: "成人向け", Horror: "ホラー", "Mahou Shoujo": "魔法少女", Mecha: "メカ", Music: "音楽", Mystery: "ミステリー",
    Psychological: "心理", Romance: "恋愛", "Sci-Fi": "SF", "Slice of Life": "日常",
    Sports: "スポーツ", Supernatural: "超常現象", Thriller: "サスペンス",
  },
  relation: {
    PARENT: "本編", SIDE_STORY: "外伝", SPIN_OFF: "スピンオフ", ALTERNATIVE: "別バージョン",
    SUMMARY: "総集編", COMPILATION: "総集編", CONTAINS: "収録作品", CHARACTER: "同じキャラクター", OTHER: "その他",
  },
  sort: {
    relevance: "関連度順", popular: "人気順", score: "評価順", trending: "トレンド", newest: "新しい順", oldest: "古い順",
  },
  tagCategory: { Theme: "テーマ", Cast: "キャラクター", Setting: "舞台", Demographic: "対象層", Technical: "技術・形式" },
  part: { season: "第{n}期", series: "シリーズ", MOVIE: "劇場版", OVA: "OVA", SPECIAL: "特別編", MUSIC: "MV", other: "パート" },
};

export default labels;
