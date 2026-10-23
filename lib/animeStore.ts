import { shared } from "./shared";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase/config";

/**
 * Наша копія даних AniList у Supabase (таблиця `anime_store`, SQL `010`). Записує лише нічний робот
 * (scripts/sync-anime-store.mts, секретний ключ — тільки в секретах GitHub); сайт лише читає публічним ключем:
 * групування аніме береться звідси (не обходимо AniList щоразу), а коли AniList не відповідає — звідси
 * беруться й картки, сторінки аніме та серії, хай навіть учорашні.
 *
 * Таблиці ще немає чи Supabase не відповідає — сайт працює як раніше (лише AniList) і кілька хвилин не питає.
 */

export type StoreKind = "franchise" | "part" | "media" | "details" | "episodes";
export type StoreHit<T> = { data: T; updatedAt: number };

const TIMEOUT_MS = 4000;
const PAUSE_MS = 10 * 60_000;
/** Скільки id в одному запиті (довжина адреси). */
const READ_CHUNK = 150;

const state = shared("animeStore", () => ({ pausedUntil: 0 }));

function pause(reason: string) {
  if (Date.now() >= state.pausedUntil) console.warn(`anime_store unavailable (${reason}), using AniList only for a while`);
  state.pausedUntil = Date.now() + PAUSE_MS;
}

/** Записи `kind` для цих id (яких немає — немає в результаті). Ніколи не кидає помилку. */
export async function readStore<T>(kind: StoreKind, ids: number[]): Promise<Map<number, StoreHit<T>>> {
  const result = new Map<number, StoreHit<T>>();
  const unique = [...new Set(ids)];
  if (unique.length === 0 || Date.now() < state.pausedUntil) return result;
  for (let i = 0; i < unique.length; i += READ_CHUNK) {
    const chunk = unique.slice(i, i + READ_CHUNK);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/anime_store?select=id,data,updated_at&kind=eq.${kind}&id=in.(${chunk.join(",")})`,
        {
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      if (!res.ok) {
        pause(`${res.status}`);
        return result;
      }
      for (const row of (await res.json()) as { id: number; data: T; updated_at: string }[])
        result.set(row.id, { data: row.data, updatedAt: Date.parse(row.updated_at) });
    } catch (error) {
      pause(String(error));
      return result;
    }
  }
  return result;
}

/** Лише для перевірок: почати з чистого стану. */
export function resetAnimeStore() {
  state.pausedUntil = 0;
}
