import type { Messages } from "..";

const recs: Messages["recs"] = {
  metaTitle: "추천 — YourMovie",
  title: "추천",
  forYou: "나를 위한 추천",
  guest: "{link}하면 내 목록과 평점을 바탕으로 애니를 골라 드려요.",
  guestLink: "로그인",
  loading: "내 목록과 평점을 바탕으로 애니를 고르는 중…",
  error: "추천을 불러오지 못했어요. 잠시 후 페이지를 새로고침해 주세요.",
  lead: "내 목록 속 애니 {count}과 평점을 바탕으로 골랐어요. 잘 맞는 작품부터 보여 드려요.",
  leadEmpty: "아직 취향을 잘 몰라서 인기작을 보여 드려요.",
  hint: "본 애니를 3편 이상 목록에 추가하고 평점을 매기면 추천이 더 정확해져요.",
  toCatalog: "카탈로그로 가기 →",
  filters: {
    kind: "유형",
    airing: "방영 상태",
    genre: "장르",
    allGenres: "모든 장르",
    kinds: { all: "전체", series: "시리즈", movies: "극장판" },
    airingOptions: { all: "전체", finished: "완결", releasing: "방영 중" },
  },
  more: "더 보기",
  noResults: "이 필터에 맞는 작품이 없어요. 다른 필터를 선택해 보세요.",
  reason: {
    rated: "‘{title}’에 {score}/10점을 주셨기 때문에",
    similarOne: "‘{title}’과(와) 비슷해요",
    similarTwo: "‘{first}’, ‘{second}’과(와) 비슷해요",
    popular: "AniList 인기작",
  },
};

export default recs;
