/** Статуси особистого списку (у базі — англійською, на сайті — українською). */
export type ListStatus = "watching" | "planning" | "completed" | "paused" | "dropped";

export const LIST_STATUSES: ListStatus[] = ["watching", "planning", "completed", "paused", "dropped"];

export const LIST_STATUS_LABELS: Record<ListStatus, string> = {
  watching: "Дивлюся",
  planning: "Планую",
  completed: "Переглянуто",
  paused: "На паузі",
  dropped: "Кинув",
};

export type ListEntry = {
  media_id: number;
  status: ListStatus;
  score: number | null;
  updated_at: string;
};

/** 7 → «7», 7.4 → «7,4». */
export function formatUserScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1).replace(".", ",");
}
