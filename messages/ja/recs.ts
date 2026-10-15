import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "おすすめ — YourMovie",
  title: "おすすめ",
  forYou: "あなたへのおすすめ",
  guest: "{link}すると、リストと評価をもとにアニメをおすすめします。",
  guestLink: "ログイン",
  loading: "リストと評価をもとにアニメを選んでいます…",
  error: "おすすめを読み込めませんでした。しばらくしてからページを再読み込みしてください。",
  lead: "リストの{count}とあなたの評価をもとに選びました。相性の良い順に並んでいます。",
  leadEmpty: "まだ好みがよくわからないので、人気の作品を表示しています。",
  hint: "視聴したアニメを3作品以上リストに追加して評価をつけると、おすすめの精度が上がります。",
  toCatalog: "カタログへ →",
  filters: {
    kind: "種類",
    airing: "放送状況",
    genre: "ジャンル",
    allGenres: "すべてのジャンル",
    kinds: { all: "すべて", series: "シリーズ", movies: "劇場版" },
    airingOptions: { all: "すべて", finished: "放送終了", releasing: "放送中" },
  },
  more: "もっと見る",
  noResults: "条件に合う作品がありません。フィルターを変えてみてください。",
  reason: {
    rated: "「{title}」を{score}/10と評価したため",
    similarOne: "「{title}」に似ています",
    similarTwo: "「{first}」や「{second}」に似ています",
    popular: "AniListで人気",
  },
};

export default recs;
