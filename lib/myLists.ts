import type { ListStatus } from "./lists";
import { getSupabaseBrowser } from "./supabase/client";
import { selectAll } from "./supabase/selectAll";

/**
 * Списки людини з бази — одним запитом для всієї сторінки: їх читають «вже в списках» (`HiddenProvider`),
 * кружечок нових серій і рекомендації. Без цього той самий список читався тричі (а «Не цікаво» — двічі)
 * на кожну сторінку. Пам'ять коротка й скидається, щойно списки змінились (`ym:lists-changed`, «Не цікаво»).
 * Лише для того, хто ввійшов (браузер).
 */

export type MyEntry = { media_id: number; status: ListStatus; score: number | null };
export type MyHiddenRow = { media_id: number; franchise_key: number };

const TTL_MS = 30_000;

/** Подія «списки змінились» (відмітили серію, змінили статус): кружечок, «вже в списках» перераховуються. */
export const LISTS_CHANGED = "ym:lists-changed";

type Cached<T> = { userId: string; at: number; promise: Promise<T[]> };
let entries: Cached<MyEntry> | null = null;
let hidden: Cached<MyHiddenRow> | null = null;

/** Хто змінив списки — викликає це: пам'ять скидається, і всі, хто слухає `LISTS_CHANGED`, перераховують. */
export function notifyListsChanged() {
  entries = null;
  window.dispatchEvent(new Event(LISTS_CHANGED));
}

function cached<T>(
  current: () => Cached<T> | null,
  userId: string,
  load: () => Promise<T[]>,
  store: (value: Cached<T> | null) => void,
): Promise<T[]> {
  const slot = current();
  if (slot && slot.userId === userId && Date.now() - slot.at < TTL_MS) return slot.promise.then((rows) => [...rows]);
  const promise = load();
  const entry = { userId, at: Date.now(), promise };
  store(entry);
  // Не вдалося — наступний виклик спробує знову.
  promise.catch(() => current() === entry && store(null));
  return promise.then((rows) => [...rows]);
}

/** Усе, що є в списках людини (кожне аніме — під ключем першої частини). */
export function myEntries(userId: string): Promise<MyEntry[]> {
  return cached(
    () => entries,
    userId,
    async () => {
      const { data, error } = await selectAll((from, to) =>
        // Лише свої: відкриті профілі інших людей теж можна читати.
        getSupabaseBrowser()
          .from("list_entries")
          .select("media_id, status, score")
          .eq("user_id", userId)
          .order("media_id")
          .range(from, to),
      );
      if (error) throw error;
      return (data as MyEntry[]).map((e) => ({ ...e, score: e.score === null ? null : Number(e.score) }));
    },
    (value) => (entries = value),
  );
}

/** «Не цікаво» людини: кожна частина й ключ аніме. */
export function myHiddenRows(userId: string): Promise<MyHiddenRow[]> {
  return cached(
    () => hidden,
    userId,
    async () => {
      const { data, error } = await selectAll((from, to) =>
        getSupabaseBrowser()
          .from("hidden_media")
          .select("media_id, franchise_key")
          .eq("user_id", userId)
          .order("media_id")
          .range(from, to),
      );
      if (error) throw error;
      return data as MyHiddenRow[];
    },
    (value) => (hidden = value),
  );
}

/** «Не цікаво» змінилось — наступне читання піде в базу. */
export function forgetMyHidden() {
  hidden = null;
}
