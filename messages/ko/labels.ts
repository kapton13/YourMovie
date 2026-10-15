import type { Messages } from "..";

const labels: Messages["labels"] = {
  format: { TV: "TV 시리즈", TV_SHORT: "TV 단편", MOVIE: "극장판", SPECIAL: "스페셜", OVA: "OVA", ONA: "ONA", MUSIC: "뮤직비디오" },
  season: { WINTER: "겨울", SPRING: "봄", SUMMER: "여름", FALL: "가을" },
  status: { FINISHED: "완결", RELEASING: "방영 중", NOT_YET_RELEASED: "방영 예정", CANCELLED: "제작 취소", HIATUS: "휴재 중" },
  source: {
    ORIGINAL: "오리지널", MANGA: "만화", LIGHT_NOVEL: "라이트 노벨", WEB_NOVEL: "웹소설", NOVEL: "소설",
    VISUAL_NOVEL: "비주얼 노벨", VIDEO_GAME: "비디오 게임", GAME: "게임", WEB_MANGA: "웹 만화", DOUJINSHI: "동인지",
    ANIME: "애니메이션", LIVE_ACTION: "실사", COMIC: "코믹스", MULTIMEDIA_PROJECT: "미디어 믹스",
    PICTURE_BOOK: "그림책", BOOK: "도서", OTHER: "기타",
  },
  country: { JP: "일본", CN: "중국", KR: "대한민국", TW: "대만" },
  genre: {
    Action: "액션", Adventure: "모험", Comedy: "코미디", Drama: "드라마", Ecchi: "엣치", Fantasy: "판타지",
    Hentai: "헨타이", Horror: "호러", "Mahou Shoujo": "마법소녀", Mecha: "메카", Music: "음악", Mystery: "미스터리",
    Psychological: "심리", Romance: "로맨스", "Sci-Fi": "SF", "Slice of Life": "일상",
    Sports: "스포츠", Supernatural: "초자연", Thriller: "스릴러",
  },
  relation: {
    PARENT: "본편", SIDE_STORY: "외전", SPIN_OFF: "스핀오프", ALTERNATIVE: "다른 버전",
    SUMMARY: "총집편", COMPILATION: "편집판", CONTAINS: "포함", CHARACTER: "같은 캐릭터", OTHER: "기타",
  },
  sort: {
    relevance: "정확도순", popular: "인기순", score: "평점순", trending: "요즘 화제순", newest: "최신순", oldest: "오래된순",
  },
  tagCategory: { Theme: "테마", Cast: "등장인물", Setting: "배경", Demographic: "대상 독자층", Technical: "기술" },
  part: { season: "{n}기", series: "시리즈", MOVIE: "극장판", OVA: "OVA", SPECIAL: "스페셜", MUSIC: "뮤직비디오", other: "파트" },
};

export default labels;
