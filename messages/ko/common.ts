import type { Messages } from "..";

const common: Messages["common"] = {
  siteDescription: "애니 트래커: 카탈로그, 나만의 목록, 추천까지.",
  siteTitle: "YourMovie — 애니 트래커",
  nav: {
    home: "홈",
    catalog: "카탈로그",
    myAnime: "내 애니",
    recommendations: "추천",
    login: "로그인",
    myProfile: "내 프로필 ({name})",
    /** Кружечок біля «Мої аніме»: у скількох аніме вийшли нові серії. */
    newEpisodes: { one: "새 화가 있는 애니 {n}편", other: "새 화가 있는 애니 {n}편" },
  },
  theme: { toggle: "주간 / 야간 테마 전환" },
  language: { label: "사이트 언어", choose: "언어" },
  footer: { dataBy: "애니 정보 제공: {source}.", shikimori: "러시아어 제목 및 설명: {source}." },
  notFound: {
    title: "페이지를 찾을 수 없어요",
    text: "링크가 오래되었거나 주소에 오타가 있을 수 있어요.",
    home: "홈으로 가기",
    animeTitle: "애니를 찾을 수 없어요",
    animeText: "링크가 오래되었을 수 있어요.",
    toCatalog: "카탈로그로 가기",
  },
  anilistError: "AniList에서 데이터를 불러오지 못했어요. 잠시 후 페이지를 새로고침해 주세요.",
  tooMany: { title: "요청이 너무 많아요", text: "검색이 너무 빨라요. 1분 정도 기다린 뒤 다시 시도해 주세요." },
  saveError: "저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  loading: "불러오는 중…",
  untitled: "제목 없음",
  yes: "예",
  no: "아니요",
  cancel: "취소",
  close: "닫기",
  done: "완료",
  episodes: { one: "{n}화", other: "{n}화" },
  anime: { one: "{n}편", other: "{n}편" },
};

export default common;
