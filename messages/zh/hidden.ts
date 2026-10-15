import type { Messages } from "..";

const hidden: Messages["hidden"] = {
  tab: "不感兴趣",
  empty: "用红色 ✕ 隐藏的动画会显示在这里。网站不会再展示或推荐它们。",
  note: "网站不会在首页、动画库或推荐中展示这些动画。",
  animeNumber: "动画 #{id}",
  restore: "恢复",
  toast: "以后不会再显示《{title}》。",
  undo: "撤销",
  crossLabel: "不感兴趣：《{title}》——不再显示",
  crossTitle: "不感兴趣——不再显示",
};

export default hidden;
