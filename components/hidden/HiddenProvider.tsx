"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useHydrated } from "@/components/useHydrated";
import type { Franchise } from "@/lib/anilist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { selectAll } from "@/lib/supabase/selectAll";
import styles from "./Hidden.module.css";

type HiddenContext = {
  /** id частин, які людина сховала («Не цікаво»). */
  hiddenIds: Set<number>;
  /** Аніме цілком: id першої частини → id усіх її частин. */
  hiddenKeys: Map<number, number[]>;
  loggedIn: boolean;
  hide: (mediaId: number, title: string) => Promise<boolean>;
  unhide: (key: number) => Promise<boolean>;
  /** id частин аніме, які вже є в списках (усі статуси, крім «Планую»). */
  listedIds: Set<number>;
  /** Перечитати, що є в списках (головна викликає при кожному відкритті). */
  refreshListed: () => Promise<void>;
};

const Context = createContext<HiddenContext | null>(null);

const EMPTY: HiddenContext = {
  hiddenIds: new Set(),
  hiddenKeys: new Map(),
  loggedIn: false,
  hide: async () => false,
  unhide: async () => false,
  listedIds: new Set(),
  refreshListed: async () => {},
};

export function useHidden(): HiddenContext {
  const context = useContext(Context) ?? EMPTY;
  const hydrated = useHydrated();
  // Картки, що приходять пізніше за цей стан, спершу мають збігтися із сервером (нічого не сховано).
  return hydrated ? context : { ...context, hiddenIds: EMPTY.hiddenIds, hiddenKeys: EMPTY.hiddenKeys, listedIds: EMPTY.listedIds, loggedIn: false };
}

type Row = { media_id: number; franchise_key: number };

/** Список «Не цікаво» для всього сайту: що сховано, сховати, повернути. */
export function HiddenProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const { m, fmt } = useI18n();
  const [loaded, setLoaded] = useState<{ userId: string; rows: Row[] } | null>(null);
  const [toast, setToast] = useState<{ key: number; title: string } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [listed, setListed] = useState<{ userId: string; ids: Set<number> } | null>(null);
  /** Аніме (id запису) → id усіх його частин; не змінюється, тож пам'ятаємо між переходами. */
  const franchiseParts = useRef(new Map<number, number[]>());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    selectAll((from, to) =>
      getSupabaseBrowser()
        .from("hidden_media")
        .select("media_id, franchise_key")
        .eq("user_id", user.id)
        .order("media_id")
        .range(from, to),
    ).then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn(error);
        setLoaded({ userId: user.id, rows: (data ?? []) as Row[] });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshListed = useCallback(async () => {
    if (!user) return;
    const { data, error } = await selectAll((from, to) =>
      getSupabaseBrowser()
        .from("list_entries")
        .select("media_id")
        .eq("user_id", user.id)
        .neq("status", "planning")
        .order("media_id")
        .range(from, to),
    );
    if (error) {
      console.warn(error);
      return;
    }
    const keys = (data as { media_id: number }[]).map((r) => r.media_id);
    const collect = () => new Set(keys.flatMap((k) => franchiseParts.current.get(k) ?? [k]));
    setListed({ userId: user.id, ids: collect() });
    // Сезон 2, фільм чи OVA теж належать аніме зі списку — дізнаємося всі частини.
    const missing = keys.filter((k) => !franchiseParts.current.has(k));
    if (missing.length === 0) return;
    for (let i = 0; i < missing.length; i += 300) {
      const chunk = missing.slice(i, i + 300);
      try {
        const res = await fetch(`/api/franchises?ids=${chunk.join(",")}`);
        if (!res.ok) continue;
        const franchises = (await res.json()) as Record<number, Franchise>;
        for (const k of chunk) {
          const f = franchises[k];
          if (f) franchiseParts.current.set(k, [k, ...[...f.main, ...f.extras].map((p) => p.id)]);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    setListed({ userId: user.id, ids: collect() });
  }, [user]);

  const listedIds = user && listed?.userId === user.id ? listed.ids : EMPTY.listedIds;
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
    <Context.Provider value={{ hiddenIds, hiddenKeys, loggedIn: Boolean(user), hide, unhide, listedIds, refreshListed }}>
      {children}
      {toast && (
        <div className={styles.toast} role="status">
          <span>{fmt(m.hidden.toast, { title: toast.title })}</span>
          <button type="button" className={styles.undo} onClick={() => unhide(toast.key)}>
            {m.hidden.undo}
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
