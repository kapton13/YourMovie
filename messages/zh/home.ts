import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "发现动画",
    text: "大家正在看什么、本季在播什么，以及人人都该看的经典。",
  },
  loading: "正在挑选…",
  trending: "当前热门",
  currentSeason: "本季新番：{season}",
  seasonName: "{year} 年{season}",
  popular: "历来最受欢迎",
  top: "评分最高",
  search: {
    placeholder: "动画标题…",
    label: "按标题搜索动画",
    submit: "搜索",
    advanced: "高级搜索：类型、年份、形式等更多筛选 →",
  },
  row: {
    seeAll: "查看全部 →",
    empty: "这里暂时还没有内容。",
  },
  card: {
    score: "评分 {score}（满分 10）",
    here: "当前所在",
  },
};

export default home;
