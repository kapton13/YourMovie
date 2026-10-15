import type { Messages } from "..";

const home: Messages["home"] = {
  intro: {
    title: "애니를 찾아보세요",
    text: "지금 다들 보고 있는 작품, 이번 분기 방영작, 누구나 한 번쯤 봐야 할 명작까지.",
  },
  loading: "작품을 고르는 중…",
  trending: "요즘 화제작",
  currentSeason: "이번 분기: {season}",
  seasonName: "{year}년 {season}",
  popular: "역대 인기작",
  top: "평점 순위",
  search: {
    placeholder: "애니 제목…",
    label: "제목으로 애니 검색",
    submit: "검색",
    advanced: "상세 검색: 장르, 연도, 형식 등 다양한 필터 →",
  },
  row: {
    seeAll: "전체 보기 →",
    empty: "아직 아무것도 없어요.",
  },
  card: {
    score: "평점 10점 만점에 {score}점",
    here: "현재 작품",
  },
};

export default home;
