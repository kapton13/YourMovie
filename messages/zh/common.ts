import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "动画追番工具：动画库、个人列表和推荐。",
  siteTitle: "YourMovie — 动画追番",
  nav: {
    home: "首页",
    catalog: "动画库",
    myAnime: "我的动画",
    recommendations: "推荐",
    login: "登录",
    myProfile: "我的主页（{name}）",
  },
  theme: { toggle: "切换日间 / 夜间模式" },
  language: { label: "网站语言", choose: "语言" },
  footer: { dataBy: "动画数据由 {source} 提供。", shikimori: "俄语标题和简介：{source}。" },
  notFound: {
    title: "页面不存在",
    text: "链接可能已失效或有拼写错误。",
    home: "返回首页",
    animeTitle: "找不到该动画",
    animeText: "链接可能已失效。",
    toCatalog: "前往动画库",
  },
  anilistError: "无法从 AniList 加载数据，请稍后刷新页面。",
  tooMany: { title: "请求过多", text: "你的搜索太频繁了。请等一分钟后再试。" },
  saveError: "保存失败，请检查网络后重试。",
  loading: "加载中…",
  untitled: "无标题",
  yes: "是",
  no: "否",
  cancel: "取消",
  close: "关闭",
  done: "完成",
  episodes: { one: "集", other: "集" },
  anime: { one: "部动画", other: "部动画" },
};

export default common;
