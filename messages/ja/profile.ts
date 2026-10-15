import type { Messages } from "..";

const profile: Messages["profile"] = {
  metaTitle: "{nickname}のプロフィール — YourMovie",
  missing: {
    title: "ユーザーが見つかりません",
    text: "ニックネーム「{nickname}」のユーザーはいません。ニックネームが変更された可能性があります。",
  },
  error: {
    title: "プロフィールを読み込めませんでした",
    text: "しばらくしてからページを再読み込みしてください。",
  },
  closed: "🔒 このプロフィールは非公開です。{nickname}さんはリストを公開していません。",
  since: "{date}から利用",
  own: {
    public: "🌐 公開プロフィール：リンクを知っている人なら誰でもこのページを見られます。",
    private: "🔒 非公開プロフィール：統計とリストはあなただけが見られます。",
    copy: "リンクをコピー",
    copied: "コピーしました ✓",
    settings: "設定",
  },
  tiles: {
    label: "概要",
    anime: "リスト内のアニメ",
    episodes: "視聴したエピソード",
    hours: "視聴時間",
    hoursDays: "視聴時間（約{days}日）",
    average: "平均評価",
  },
  scores: {
    title: "評価",
    tip: "評価{score}：{count}",
    caption: "1〜10の各評価をつけたアニメの数",
    empty: "評価したアニメはまだありません。",
  },
  months: {
    title: "月別の視聴エピソード",
    caption: "過去1年間に月ごとに視聴済みにしたエピソードの数",
    footnote: "チェックした日付で集計しています。「シーズンをすべて視聴済み」を使うと、全話が同じ日に記録されます。",
    empty: "過去1年間に視聴済みにしたエピソードはありません。",
  },
  genres: {
    title: "好きなジャンル",
    empty: "視聴中または視聴完了のアニメがリストに入ると、ジャンルが表示されます。",
  },
  lists: {
    title: "リスト",
    empty: "このリストはまだ空です。",
  },
  status: {
    watching: "視聴中",
    planning: "視聴予定",
    completed: "視聴完了",
    paused: "一時中断",
    dropped: "視聴中止",
  },
};

export default profile;
