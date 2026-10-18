import type { ListStatus } from "./lists";

/**
 * «Нова серія!» (сторінка «Мої аніме» й лічильник у шапці — одне правило):
 * у частині аніме є серія, що вже вийшла й не відмічена, і остання вийшла не раніше ніж 7 днів тому.
 * Частина рахується, якщо вона основна (сезон) або людина вже почала її дивитися (OVA, фільм).
 */

export const NEW_EPISODE_DAYS = 7;

type Marks = Map<number, { watched: boolean }> | undefined;

/** Номери серій, що вже вийшли, але не відмічені переглянутими. */
export function unwatchedAired(aired: number, marks: Marks): number[] {
  const out: number[] = [];
  for (let n = 1; n <= aired; n++) if (!marks?.get(n)?.watched) out.push(n);
  return out;
}

/** Чи чекає частина на перегляд: є непереглянуті серії, і це сезон або вже почата побічна частина. */
export function isPending(unwatched: number[], isMain: boolean, marks: Marks): boolean {
  const started = Boolean(marks && [...marks.values()].some((m) => m.watched));
  return unwatched.length > 0 && (isMain || started);
}

/** Нова серія: частина чекає на перегляд, а остання серія вийшла за останні 7 днів (`now`, `lastAiredAt` — секунди). */
export function isNewEpisode(pending: boolean, lastAiredAt: number | null | undefined, now: number): boolean {
  return Boolean(pending && lastAiredAt && now - lastAiredAt < NEW_EPISODE_DAYS * 86400);
}

export type AnimeParts = {
  status: ListStatus;
  parts: { aired: number; lastAiredAt: number | null | undefined; isMain: boolean; marks: Marks }[];
};

/**
 * Скільки аніме мають нову серію — для лічильника в шапці. Рахуємо «Дивлюся» і «Переглянуто»
 * (з новою серією «Переглянуто» саме повертається в «Дивлюся»); «Планую», «На паузі», «Кинув» — ні.
 */
export function countWithNewEpisodes(list: AnimeParts[], now: number): number {
  return list.filter(
    (anime) =>
      (anime.status === "watching" || anime.status === "completed") &&
      anime.parts.some((p) => isNewEpisode(isPending(unwatchedAired(p.aired, p.marks), p.isMain, p.marks), p.lastAiredAt, now)),
  ).length;
}
