import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "アニメを探そう",
    text: "いま話題の作品、今期放送中のアニメ、そして誰もが一度は見るべき名作。",
  },
  loading: "作品を選んでいます…",
  trending: "いま話題",
  currentSeason: "今期：{season}",
  seasonName: "{year}年{season}",
  popular: "歴代人気",
  top: "高評価ランキング",
  search: {
    placeholder: "アニメのタイトル…",
    label: "タイトルでアニメを検索",
    submit: "検索",
    advanced: "詳細検索：ジャンル、年、形式などで絞り込む →",
  },
  row: {
    seeAll: "すべて見る →",
    empty: "まだ何もありません。",
  },
  card: {
    score: "評価 {score}／10",
    here: "このページ",
  },
};

export default home;
