import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "TV 动画", TV_SHORT: "短篇动画", MOVIE: "剧场版", SPECIAL: "特别篇", OVA: "OVA", ONA: "ONA", MUSIC: "MV" },
  season: { WINTER: "冬季", SPRING: "春季", SUMMER: "夏季", FALL: "秋季" },
  status: { FINISHED: "已完结", RELEASING: "连载中", NOT_YET_RELEASED: "未播出", CANCELLED: "已取消", HIATUS: "暂停中" },
  source: {
    ORIGINAL: "原创", MANGA: "漫画", LIGHT_NOVEL: "轻小说", WEB_NOVEL: "网络小说", NOVEL: "小说",
    VISUAL_NOVEL: "视觉小说", VIDEO_GAME: "电子游戏", GAME: "游戏", WEB_MANGA: "网络漫画", DOUJINSHI: "同人志",
    ANIME: "动画", LIVE_ACTION: "真人作品", COMIC: "美漫", MULTIMEDIA_PROJECT: "跨媒体企划",
    PICTURE_BOOK: "绘本", BOOK: "书籍", OTHER: "其他",
  },
  country: { JP: "日本", CN: "中国大陆", KR: "韩国", TW: "台湾" },
  genre: {
    Action: "动作", Adventure: "冒险", Comedy: "喜剧", Drama: "剧情", Ecchi: "卖肉", Fantasy: "奇幻",
    Hentai: "里番", Horror: "恐怖", "Mahou Shoujo": "魔法少女", Mecha: "机战", Music: "音乐", Mystery: "悬疑",
    Psychological: "心理", Romance: "恋爱", "Sci-Fi": "科幻", "Slice of Life": "日常",
    Sports: "运动", Supernatural: "超自然", Thriller: "惊悚",
  },
  relation: {
    PARENT: "正篇", SIDE_STORY: "外传", SPIN_OFF: "衍生作品", ALTERNATIVE: "其他版本",
    SUMMARY: "总集篇", COMPILATION: "剪辑版", CONTAINS: "包含", CHARACTER: "相同角色", OTHER: "其他",
  },
  sort: {
    relevance: "最相关", popular: "人气", score: "评分", trending: "当前热门", newest: "最新优先", oldest: "最早优先",
  },
  tagCategory: { Theme: "主题", Cast: "角色", Setting: "背景设定", Demographic: "受众", Technical: "制作技术" },
  part: { season: "第 {n} 季", series: "系列", MOVIE: "剧场版", OVA: "OVA", SPECIAL: "特别篇", MUSIC: "MV", other: "部分" },
};

export default labels;
