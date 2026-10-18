import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "アニメトラッカー：カタログ、マイリスト、おすすめ。",
  siteTitle: "YourMovie — アニメトラッカー",
  nav: {
    home: "ホーム",
    catalog: "カタログ",
    myAnime: "マイアニメ",
    recommendations: "おすすめ",
    login: "ログイン",
    myProfile: "マイプロフィール（{name}）",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "新しい話がある作品：{n}", other: "新しい話がある作品：{n}" },
  },
  theme: { toggle: "ライト／ダークテーマを切り替え" },
  language: { label: "表示言語", choose: "言語" },
  footer: { dataBy: "アニメのデータ提供：{source}", shikimori: "ロシア語のタイトルとあらすじ：{source}" },
  notFound: {
    title: "ページが見つかりません",
    text: "リンクが古いか、入力に誤りがある可能性があります。",
    home: "ホームへ戻る",
    animeTitle: "アニメが見つかりません",
    animeText: "リンクが古い可能性があります。",
    toCatalog: "カタログへ",
  },
  anilistError: "AniListからデータを読み込めませんでした。しばらくしてからページを再読み込みしてください。",
  tooMany: { title: "リクエストが多すぎます", text: "検索が速すぎます。1分ほど待ってからもう一度お試しください。" },
  saveError: "保存できませんでした。接続を確認して、もう一度お試しください。",
  loading: "読み込み中…",
  untitled: "タイトルなし",
  yes: "はい",
  no: "いいえ",
  cancel: "キャンセル",
  close: "閉じる",
  done: "完了",
  episodes: { one: "{n}話", other: "{n}話" },
  anime: { one: "{n}作品", other: "{n}作品" },
};

export default common;
