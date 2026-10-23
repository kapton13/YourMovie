"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import type { Franchise, MyMedia } from "@/lib/anilist";
import { countWithNewEpisodes, type AnimeParts } from "@/lib/newEpisodes";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LISTS_CHANGED, myEntries } from "@/lib/myLists";
import { selectAll } from "@/lib/supabase/selectAll";

export { LISTS_CHANGED, notifyListsChanged } from "@/lib/myLists";

/** Скільки пам'ятаємо порахований лічильник (між сторінками й перезавантаженнями вкладки). */
const CACHE_MS = 10 * 60 * 1000;
const cacheKey = (userId: string) => `ym-new-episodes:${userId}`;

function readCache(userId: string): number | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(cacheKey(userId)) ?? "null") as { count: number; at: number } | null;
    return saved && Date.now() - saved.at < CACHE_MS ? saved.count : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, count: number | null) {
  try {
    if (count === null) sessionStorage.removeItem(cacheKey(userId));
    else sessionStorage.setItem(cacheKey(userId), JSON.stringify({ count, at: Date.now() }));
  } catch {
    // Браузер не дає зберегти — просто порахуємо наступного разу.
  }
}

async function inChunks<T>(ids: number[], size: number, load: (chunk: number[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += size) out.push(...(await load(ids.slice(i, i + size))));
  return out;
}

/** У скількох аніме зі списку вийшли нові серії (правило — `lib/newEpisodes.ts`). */
async function countNewEpisodes(userId: string): Promise<number> {
  const supabase = getSupabaseBrowser();
  const list = (await myEntries(userId)).filter((e) => e.status === "watching" || e.status === "completed");
  if (list.length === 0) return 0;

  const franchises: Record<number, Franchise> = {};
  await inChunks(list.map((e) => e.media_id), 300, async (chunk) => {
    const res = await fetch(`/api/franchises?ids=${chunk.join(",")}`);
    if (res.ok) Object.assign(franchises, await res.json());
    return [];
  });
  const partsOf = (key: number) => {
    const f = franchises[key];
    return f ? [...f.main.map((p) => ({ id: p.id, isMain: true })), ...f.extras.map((p) => ({ id: p.id, isMain: false }))] : [{ id: key, isMain: true }];
  };
  const partIds = [...new Set(list.flatMap((e) => partsOf(e.media_id).map((p) => p.id)))];

  const marks = new Map<number, Map<number, { watched: boolean }>>();
  const rows = await inChunks(partIds, 150, async (chunk) => {
    const { data, error: marksError } = await selectAll((from, to) =>
      supabase
        .from("episode_marks")
        .select("media_id, episode, watched")
        .eq("user_id", userId)
        .in("media_id", chunk)
        .order("media_id")
        .order("episode")
        .range(from, to),
    );
    if (marksError) throw marksError;
    return (data ?? []) as { media_id: number; episode: number; watched: boolean }[];
  });
  for (const r of rows) {
    if (!marks.has(r.media_id)) marks.set(r.media_id, new Map());
    marks.get(r.media_id)!.set(r.episode, { watched: r.watched });
  }

  const media = new Map<number, MyMedia>();
  await inChunks(partIds, 200, async (chunk) => {
    const res = await fetch(`/api/my-media?ids=${chunk.join(",")}`);
    if (!res.ok) throw new Error(`my-media ${res.status}`);
    for (const m of (await res.json()) as MyMedia[]) media.set(m.id, m);
    return [];
  });

  const anime: AnimeParts[] = list.map((e) => ({
    status: e.status,
    parts: partsOf(e.media_id).map((p) => ({
      aired: media.get(p.id)?.airedCount ?? 0,
      lastAiredAt: media.get(p.id)?.lastAiredAt,
      isMain: p.isMain,
      marks: marks.get(p.id),
    })),
  }));
  return countWithNewEpisodes(anime, Date.now() / 1000);
}

/** Лічильник для шапки: null — ще не відомо (або не ввійшли). */
export function useNewEpisodes(): number | null {
  const user = useUser();
  const userId = user?.id;
  const [state, setState] = useState<{ userId: string; count: number } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: number | undefined;
    const refresh = (force: boolean, retry = true) => {
      const cached = force ? null : readCache(userId);
      if (cached !== null) return setState({ userId, count: cached });
      countNewEpisodes(userId)
        .then((count) => {
          writeCache(userId, count);
          if (!cancelled) setState({ userId, count });
        })
        .catch((e) => {
          // AniList зайнятий (ліміт запитів) — ще раз трохи згодом; знову ні — просто без кружечка.
          console.warn(e);
          if (retry && !cancelled) timer = window.setTimeout(() => refresh(true, false), 8000);
        });
    };
    refresh(false);
    // Відмітили серію чи змінили статус — перерахувати (трохи згодом: кілька кліків поспіль — один перерахунок).
    const onChange = () => {
      writeCache(userId, null);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => refresh(true), 1500);
    };
    window.addEventListener(LISTS_CHANGED, onChange);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(LISTS_CHANGED, onChange);
    };
  }, [userId]);

  return userId && state?.userId === userId ? state.count : null;
}
