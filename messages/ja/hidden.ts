import type { Messages } from "..";

const hidden: Messages["hidden"] = {
  tab: "興味なし",
  empty: "赤い ✕ で非表示にしたアニメがここに表示されます。これらの作品はサイト上で表示もおすすめもされません。",
  note: "これらのアニメはホーム、カタログ、おすすめに表示されません。",
  animeNumber: "アニメ #{id}",
  restore: "元に戻す",
  toast: "「{title}」は今後表示されません。",
  undo: "元に戻す",
  crossLabel: "興味なし：「{title}」— 今後表示しない",
  crossTitle: "興味なし — 今後表示しない",
};

export default hidden;
