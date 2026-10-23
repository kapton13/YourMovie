"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useHydrated } from "@/components/useHydrated";
import type { Franchise } from "@/lib/anilist";
import { franchiseRows, quickRows, rowsToComplete, type HiddenRow } from "@/lib/hidden";
import { LISTS_CHANGED, forgetMyHidden, myEntries, myHiddenRows } from "@/lib/myLists";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./Hidden.module.css";

type HiddenContext = {
  /** id частин, які людина сховала («Не цікаво»). */
  hiddenIds: Set<number>;
  /** Аніме цілком: id першої частини → id усіх її частин. */
  hiddenKeys: Map<number, number[]>;
  loggedIn: boolean;
  /** rootId — перша частина аніме, якщо картка її знає: тоді одразу зникають усі сезони. */
  hide: (mediaId: number, title: string, rootId?: number) => Promise<boolean>;
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

type Row = HiddenRow;

/** Частини аніме з AniList (через наш сервер); одна повторна спроба — великі аніме інколи не встигають. */
async function fetchFranchises(ids: number[]): Promise<Record<number, Franchise>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`/api/franchises?ids=${ids.join(",")}`);
      if (res.ok) return (await res.json()) as Record<number, Franchise>;
    } catch (e) {
      console.warn(e);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return {};
}

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
  /** Для кого вже доповнили «Не цікаво» в цьому відкритті сайту. */
  const completedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    myHiddenRows(user.id)
      .catch((error) => {
        console.warn(error);
        return [] as Row[];
      })
      .then((rows) => {
        if (!cancelled) setLoaded({ userId: user.id, rows });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Доповнюємо «Не цікаво»: аніме, сховане не повністю (AniList тоді не встиг), і нові сезони, що вийшли пізніше.
  useEffect(() => {
    if (!user || loaded?.userId !== user.id || completedFor.current === user.id) return;
    completedFor.current = user.id;
    const groups = new Map<number, number[]>();
    for (const r of loaded.rows) groups.set(r.franchise_key, [...(groups.get(r.franchise_key) ?? []), r.media_id]);
    const keys = [...groups.keys()].slice(0, 600);
    (async () => {
      for (let i = 0; i < keys.length; i += 300) {
        const chunk = keys.slice(i, i + 300);
        const franchises = await fetchFranchises(chunk);
        const fixes = rowsToComplete(new Map(chunk.map((key) => [key, groups.get(key)!])), franchises);
        if (fixes.length === 0) continue;
        const { error } = await getSupabaseBrowser().from("hidden_media").upsert(fixes);
        forgetMyHidden();
        if (error) {
          console.warn(error);
          continue;
        }
        const ids = new Set(fixes.map((r) => r.media_id));
        setLoaded((prev) =>
          prev && prev.userId === user.id ? { ...prev, rows: [...prev.rows.filter((r) => !ids.has(r.media_id)), ...fixes] } : prev,
        );
      }
    })();
  }, [user, loaded]);

  const refreshListed = useCallback(async () => {
    if (!user) return;
    let keys: number[];
    try {
      keys = (await myEntries(user.id)).filter((e) => e.status !== "planning").map((e) => e.media_id);
    } catch (error) {
      console.warn(error);
      return;
    }
    const collect = () => new Set(keys.flatMap((k) => franchiseParts.current.get(k) ?? [k]));
    setListed({ userId: user.id, ids: collect() });
    // Сезон 2, фільм чи OVA теж належать аніме зі списку — дізнаємося всі частини. Довгий список уперше
    // сервер віддає частинами (або AniList відмовив) — ще одна спроба трохи згодом, уже з кешу сервера.
    for (let attempt = 0; attempt < 2; attempt++) {
      const missing = keys.filter((k) => !franchiseParts.current.has(k));
      if (missing.length === 0) return;
      if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
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
    }
  }, [user]);

  // Щойно оцінене чи додане аніме зникає з порад одразу, а не після переходу на іншу сторінку.
  // (Лише якщо список «вже в списках» тут потрібен — його вмикає `SkipListed`.)
  const tracking = listed !== null;
  useEffect(() => {
    if (!tracking) return;
    // Кілька кліків поспіль (серії одна за одною) — одне оновлення.
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refreshListed(), 800);
    };
    window.addEventListener(LISTS_CHANGED, refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(LISTS_CHANGED, refresh);
    };
  }, [tracking, refreshListed]);

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
      forgetMyHidden();
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
    async (mediaId: number, title: string, rootId?: number) => {
      // Одразу ховаємо картку й перший сезон (а з ним — усі картки цього аніме), потім — усі частини.
      const quick = quickRows(mediaId, rootId);
      const quickIds = new Set(quick.map((r) => r.media_id));
      setRows((list) => [...list.filter((r) => !quickIds.has(r.media_id)), ...quick]);
      const franchise = (await fetchFranchises([mediaId]))[mediaId];
      // AniList не відповів — зберігаємо хоча б це; решту частин доповнимо, коли сайт відкриють наступного разу.
      const rowsToSave = franchise ? franchiseRows(franchise, [...quickIds]) : quick;
      const { error } = await getSupabaseBrowser().from("hidden_media").upsert(rowsToSave);
      forgetMyHidden();
      if (error) {
        console.error(error);
        setRows((list) => list.filter((r) => !quickIds.has(r.media_id)));
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
