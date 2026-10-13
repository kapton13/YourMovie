"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import type { Franchise } from "@/lib/anilist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./Hidden.module.css";

type HiddenContext = {
  /** id частин, які людина сховала («Не цікаво»). */
  hiddenIds: Set<number>;
  /** Аніме цілком: id першої частини → id усіх її частин. */
  hiddenKeys: Map<number, number[]>;
  loggedIn: boolean;
  hide: (mediaId: number, title: string) => Promise<boolean>;
  unhide: (key: number) => Promise<boolean>;
};

const Context = createContext<HiddenContext | null>(null);

const EMPTY: HiddenContext = {
  hiddenIds: new Set(),
  hiddenKeys: new Map(),
  loggedIn: false,
  hide: async () => false,
  unhide: async () => false,
};

export function useHidden(): HiddenContext {
  return useContext(Context) ?? EMPTY;
}

type Row = { media_id: number; franchise_key: number };

/** Список «Не цікаво» для всього сайту: що сховано, сховати, повернути. */
export function HiddenProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [loaded, setLoaded] = useState<{ userId: string; rows: Row[] } | null>(null);
  const [toast, setToast] = useState<{ key: number; title: string } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSupabaseBrowser()
      .from("hidden_media")
      .select("media_id, franchise_key")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn(error);
        setLoaded({ userId: user.id, rows: (data ?? []) as Row[] });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const rows = user && loaded?.userId === user.id ? loaded.rows : [];
  const hiddenIds = new Set(rows.map((r) => r.media_id));
  const hiddenKeys = new Map<number, number[]>();
  for (const r of rows) hiddenKeys.set(r.franchise_key, [...(hiddenKeys.get(r.franchise_key) ?? []), r.media_id]);

  const setRows = useCallback(
    (update: (rows: Row[]) => Row[]) => setLoaded((prev) => (prev ? { ...prev, rows: update(prev.rows) } : prev)),
    [],
  );

  const unhide = useCallback(
    async (key: number) => {
      let removed: Row[] = [];
      setRows((list) => {
        removed = list.filter((r) => r.franchise_key === key);
        return list.filter((r) => r.franchise_key !== key);
      });
      setToast(null);
      const { error } = await getSupabaseBrowser().from("hidden_media").delete().eq("franchise_key", key);
      if (error) {
        console.error(error);
        setRows((list) => [...list, ...removed]);
        return false;
      }
      return true;
    },
    [setRows],
  );

  const hide = useCallback(
    async (mediaId: number, title: string) => {
      // Одразу ховаємо саму картку, потім — усі частини цього аніме.
      setRows((list) => [...list, { media_id: mediaId, franchise_key: mediaId }]);
      let rowsToSave: Row[] = [{ media_id: mediaId, franchise_key: mediaId }];
      try {
        const res = await fetch(`/api/franchises?ids=${mediaId}`);
        if (res.ok) {
          const franchise = ((await res.json()) as Record<number, Franchise>)[mediaId];
          if (franchise) {
            rowsToSave = [...franchise.main, ...franchise.extras].map((p) => ({
              media_id: p.id,
              franchise_key: franchise.key,
            }));
            if (!rowsToSave.some((r) => r.media_id === mediaId))
              rowsToSave.push({ media_id: mediaId, franchise_key: franchise.key });
          }
        }
      } catch (e) {
        console.warn(e);
      }
      const { error } = await getSupabaseBrowser().from("hidden_media").upsert(rowsToSave);
      if (error) {
        console.error(error);
        setRows((list) => list.filter((r) => r.media_id !== mediaId));
        return false;
      }
      const ids = new Set(rowsToSave.map((r) => r.media_id));
      setRows((list) => [...list.filter((r) => !ids.has(r.media_id)), ...rowsToSave]);
      window.clearTimeout(toastTimer.current);
      setToast({ key: rowsToSave[0].franchise_key, title });
      toastTimer.current = window.setTimeout(() => setToast(null), 7000);
      return true;
    },
    [setRows],
  );

  return (
    <Context.Provider value={{ hiddenIds, hiddenKeys, loggedIn: Boolean(user), hide, unhide }}>
      {children}
      {toast && (
        <div className={styles.toast} role="status">
          <span>
            «{toast.title}» більше не показуватиметься.
          </span>
          <button type="button" className={styles.undo} onClick={() => unhide(toast.key)}>
            Скасувати
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
