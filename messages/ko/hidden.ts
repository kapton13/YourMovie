import type { Messages } from "..";

const hidden: Messages["hidden"] = {
  tab: "관심 없음",
  empty: "빨간 ✕ 표시로 숨긴 애니가 여기에 표시돼요. 숨긴 작품은 사이트에 표시되거나 추천되지 않아요.",
  note: "이 애니들은 홈, 카탈로그, 추천에 표시되지 않아요.",
  animeNumber: "애니 #{id}",
  restore: "되돌리기",
  toast: "‘{title}’ 작품은 이제 표시되지 않아요.",
  undo: "실행 취소",
  crossLabel: "관심 없음: ‘{title}’ — 다시 표시하지 않기",
  crossTitle: "관심 없음 — 다시 표시하지 않기",
};

export default hidden;
