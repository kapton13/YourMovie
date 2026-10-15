import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "アニメ — YourMovie",
  loading: "読み込み中…",
  poster: "ポスター：{title}",
  rating: {
    note: "AniListユーザーの平均評価",
    votes: { one: "{n}件の評価", other: "{n}件の評価" },
    none: "まだ評価がありません",
  },
  nextEpisode: "第{n}話は{date}に放送",
  franchise: {
    root: "このアニメは{n}つのパートで構成されています。視聴ステータスと評価は作品全体に適用されます。",
    partOf: "{title}の一部",
    quoted: "「{title}」",
    position: "（{total}中{n}番目）",
    extra: "番外編",
  },
  description: {
    heading: "あらすじ",
    empty: "あらすじはまだありません。",
    englishNote: "あらすじはAniListが提供する英語版です。",
    sourceNote: "あらすじ：{source}",
  },
  tags: "タグ",
  info: {
    format: "形式",
    episodes: "話数",
    duration: "1話の長さ",
    minutes: "{n}分",
    status: "放送状況",
    season: "シーズン",
    dates: "放送期間",
    studio: "制作会社",
    source: "原作",
    country: "国",
    popularity: "リスト登録数",
    anilistPage: "AniListのページ ↗",
  },
  watchOrder: "視聴順",
  announced: "未定",
  related: "関連作品",
  similar: "似ているアニメ",
};

export default anime;
