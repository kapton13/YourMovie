/** Статуси особистого списку (у базі — англійською кодами; назви мовами — у словниках, `m.list.statuses`). */
export type ListStatus = "watching" | "planning" | "completed" | "paused" | "dropped";

export const LIST_STATUSES: ListStatus[] = ["watching", "planning", "completed", "paused", "dropped"];

export type ListEntry = {
  media_id: number;
  status: ListStatus;
  score: number | null;
  updated_at: string;
};
