import type { Messages } from "..";

const anime: Messages["anime"] = {
  metaTitle: "{title} — YourMovie",
  metaFallback: "애니 — YourMovie",
  loading: "불러오는 중…",
  poster: "포스터: {title}",
  rating: {
    note: "AniList 사용자 평균 평점",
    votes: { one: "{n}명 평가", other: "{n}명 평가" },
    none: "아직 평점 없음",
  },
  nextEpisode: "{n}화 방영: {date}",
  franchise: {
    root: "이 애니는 {n}개 파트로 이루어져 있어요. 시청 상태와 평점은 애니 전체에 적용돼요.",
    partOf: "{title}의 일부",
    quoted: "‘{title}’",
    position: "({total}개 중 {n}번째)",
    extra: "번외",
  },
  description: {
    heading: "줄거리",
    empty: "아직 줄거리가 없어요.",
    englishNote: "줄거리는 AniList에서 제공한 영어 원문이에요.",
    sourceNote: "줄거리 출처: {source}.",
  },
  tags: "태그",
  info: {
    format: "형식",
    episodes: "화수",
    duration: "회당 길이",
    minutes: "{n}분",
    status: "방영 상태",
    season: "분기",
    dates: "방영 기간",
    studio: "제작사",
    source: "원작",
    country: "국가",
    popularity: "목록에 추가한 사람",
    anilistPage: "AniList 페이지 ↗",
  },
  watchOrder: "시청 순서",
  announced: "미정",
  related: "관련 작품",
  similar: "비슷한 애니",
};

export default anime;
