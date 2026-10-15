import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname} — YourMovie 프로필",
  missing: {
    title: "사용자를 찾을 수 없어요",
    text: "‘{nickname}’ 닉네임을 쓰는 사용자가 없어요. 닉네임을 바꿨을 수도 있어요.",
  },
  error: {
    title: "프로필을 불러오지 못했어요",
    text: "잠시 후 페이지를 새로고침해 주세요.",
  },
  closed: "🔒 비공개 프로필이에요. {nickname} 님은 목록을 공개하지 않았어요.",
  since: "{date} 가입",
  own: {
    public: "🌐 공개 프로필 — 링크가 있는 누구나 이 페이지를 볼 수 있어요.",
    private: "🔒 비공개 프로필 — 통계와 목록은 나만 볼 수 있어요.",
    copy: "링크 복사",
    copied: "복사됨 ✓",
    settings: "설정",
  },
  tiles: {
    label: "요약",
    anime: "목록 속 애니",
    episodes: "시청한 에피소드",
    hours: "시청 시간",
    hoursDays: "시간 ≈ {days}일",
    average: "평균 평점",
  },
  scores: {
    title: "평점",
    tip: "{score}점: {count}",
    caption: "1~10점 각 평점을 준 애니 수",
    empty: "아직 평점을 매긴 애니가 없어요.",
  },
  months: {
    title: "월별 시청 에피소드",
    caption: "최근 1년 동안 매달 시청으로 체크한 에피소드 수",
    footnote: "체크한 날짜 기준이에요. ‘시즌 전체를 봤어요’를 누르면 모든 화가 같은 날로 기록돼요.",
    empty: "최근 1년 동안 체크한 에피소드가 없어요.",
  },
  genres: {
    title: "좋아하는 장르",
    empty: "보는 중이거나 다 본 애니가 목록에 생기면 장르가 표시돼요.",
  },
  lists: {
    title: "목록",
    empty: "아직 이 목록은 비어 있어요.",
  },
  status: {
    watching: "보는 중",
    planning: "볼 예정",
    completed: "시청 완료",
    paused: "보류",
    dropped: "하차",
  },
};

export default profile;
