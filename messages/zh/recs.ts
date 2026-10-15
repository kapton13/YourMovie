import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "推荐 — YourMovie",
  title: "推荐",
  forYou: "为你推荐",
  guest: "{link}后，我们会根据你的列表和评分为你挑选动画。",
  guestLink: "登录",
  loading: "正在根据你的列表和评分挑选动画…",
  error: "无法加载推荐，请稍后刷新页面。",
  lead: "根据你列表中的 {count}及你的评分挑选，最匹配的排在前面。",
  leadEmpty: "我们对你的口味还不太了解，先看看热门作品吧。",
  hint: "在列表中添加至少 3 部看过的动画并评分，推荐会更准确。",
  toCatalog: "前往动画库 →",
  filters: {
    kind: "形式",
    airing: "状态",
    genre: "类型",
    allGenres: "全部类型",
    kinds: { all: "全部", series: "剧集", movies: "剧场版" },
    airingOptions: { all: "全部", finished: "已完结", releasing: "正在播出" },
  },
  more: "显示更多",
  noResults: "没有符合这些筛选条件的结果，换个条件试试。",
  reason: {
    rated: "因为你给《{title}》打了 {score}/10 分",
    similarOne: "与《{title}》相似",
    similarTwo: "与《{first}》和《{second}》相似",
    popular: "AniList 热门",
  },
};

export default recs;
