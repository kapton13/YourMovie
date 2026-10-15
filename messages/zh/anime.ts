import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "动画 — YourMovie",
  loading: "加载中…",
  poster: "海报：{title}",
  rating: {
    note: "AniList 用户平均评分",
    votes: { one: "人评分", other: "人评分" },
    none: "暂无评分",
  },
  nextEpisode: "第 {n} 集将于 {date} 播出",
  franchise: {
    root: "这部动画共有 {n} 个部分。你的状态和评分适用于整部动画。",
    partOf: "属于{title}",
    quoted: "《{title}》",
    position: "（第 {n} 部，共 {total} 部）",
    extra: "番外",
  },
  description: {
    heading: "简介",
    empty: "暂无简介。",
    englishNote: "简介为英文，由 AniList 提供。",
    sourceNote: "简介：{source}。",
  },
  tags: "标签",
  info: {
    format: "类型",
    episodes: "集数",
    duration: "单集时长",
    minutes: "{n} 分钟",
    status: "状态",
    season: "季度",
    dates: "播出时间",
    studio: "制作公司",
    source: "原作",
    country: "国家/地区",
    popularity: "加入列表人数",
    anilistPage: "AniList 页面 ↗",
  },
  watchOrder: "观看顺序",
  announced: "待定",
  related: "相关作品",
  similar: "相似动画",
};

export default anime;
