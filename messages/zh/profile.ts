import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} 的 YourMovie 主页",
  missing: {
    title: "找不到该用户",
    text: "没有昵称为“{nickname}”的用户，对方可能已修改昵称。",
  },
  error: {
    title: "无法加载主页",
    text: "请稍后刷新页面。",
  },
  closed: "🔒 该主页未公开——{nickname} 没有公开自己的列表。",
  since: "{date} 加入",
  own: {
    public: "🌐 公开主页——任何拥有链接的人都能看到此页面。",
    private: "🔒 私密主页——只有你自己能看到你的统计和列表。",
    copy: "复制链接",
    copied: "已复制 ✓",
    settings: "设置",
  },
  tiles: {
    label: "概览",
    anime: "列表中的动画",
    episodes: "已看集数",
    hours: "观看小时数",
    hoursDays: "小时 ≈ {days} 天",
    average: "平均评分",
  },
  scores: {
    title: "评分",
    tip: "{score} 分：{count}",
    caption: "每个分数（1 到 10 分）各有多少部动画",
    empty: "还没有评过分的动画。",
  },
  months: {
    title: "每月观看集数",
    caption: "过去一年中每个月标记为已看的集数",
    footnote: "按标记日期统计：“本季已全部看完”会把所有集数记在同一天。",
    empty: "过去一年没有标记过任何剧集。",
  },
  genres: {
    title: "最爱的类型",
    empty: "当你的列表中有在看或看过的动画后，这里就会显示类型。",
  },
  lists: {
    title: "列表",
    empty: "这个列表暂时是空的。",
  },
  status: {
    watching: "在看",
    planning: "想看",
    completed: "看过",
    paused: "搁置",
    dropped: "抛弃",
  },
};

export default profile;
