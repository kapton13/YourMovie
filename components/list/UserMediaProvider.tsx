"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import type { ListEntry, ListStatus } from "@/lib/lists";
import { entryAfterMarks } from "@/lib/listRules";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type EpisodeMark = { watched: boolean; score: number | null };

type Marks = Map<number, EpisodeMark>;

type Context = {
  user: User | null | undefined;
  /** undefined — завантажуємо, null — аніме немає в списку. */
  entry: ListEntry | null | undefined;
  marks: Marks | undefined;
  saving: boolean;
  error: string;
  airedCount: number;
  total: number | null;
  setStatus: (status: ListStatus) => void;
  setScore: (score: number | null) => void;
  remove: () => void;
  setWatched: (episodes: number[], watched: boolean) => void;
  rateEpisode: (episode: number, score: number | null) => void;
};

const UserMediaContext = createContext<Context | null>(null);

export function useUserMedia(): Context {
  const context = useContext(UserMediaContext);
  if (!context) throw new Error("useUserMedia: немає UserMediaProvider");
  return context;
}

const ENTRY_FIELDS = "media_id, status, score, updated_at";

/**
 * Усе, що користувач позначив для одного аніме: статус, оцінка, серії.
 * Правила узгодження:
 * — відмітили серію, а аніме ще не в списку або «Планую» → «Дивлюся»;
 * — переглянули всі серії завершеного аніме → «Переглянуто»;
 * — оцінили всі серії → оцінка аніме = середнє (до десятих).
 */
export function UserMediaProvider({
  mediaId,
  total,
  airedCount,
  finished,
  children,
}: {
  mediaId: number;
  total: number | null;
  airedCount: number;
  finished: boolean;
  children: React.ReactNode;
}) {
  const user = useUser();
  const [loaded, setLoaded] = useState<{ userId: string; entry: ListEntry | null; marks: Marks } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    Promise.all([
      supabase.from("list_entries").select(ENTRY_FIELDS).eq("media_id", mediaId).maybeSingle(),
      supabase.from("episode_marks").select("episode, watched, score").eq("media_id", mediaId),
    ]).then(([entryRes, marksRes]) => {
      if (cancelled) return;
      if (entryRes.error || marksRes.error) {
        console.error(entryRes.error ?? marksRes.error);
        setError("Не вдалося завантажити ваш список. Оновіть сторінку.");
      }
      const marks: Marks = new Map();
      for (const m of (marksRes.data ?? []) as { episode: number; watched: boolean; score: number | null }[])
        marks.set(m.episode, { watched: m.watched, score: m.score });
      setLoaded({ userId: user.id, entry: (entryRes.data as ListEntry | null) ?? null, marks });
    });
    return () => {
      cancelled = true;
    };
  }, [user, mediaId]);

  const current = user && loaded?.userId === user.id ? loaded : null;
  const entry = user === null ? null : current ? current.entry : undefined;
  const marks = current?.marks;

  function update(next: { entry?: ListEntry | null; marks?: Marks }) {
    setLoaded((prev) => (prev ? { ...prev, ...next } : prev));
  }

  /** Виконати зміну оптимістично; якщо база відмовила — повернути як було. */
  async function run(optimistic: { entry?: ListEntry | null; marks?: Marks }, write: () => Promise<string | null>) {
    if (!current) return;
    const before = { entry: current.entry, marks: current.marks };
    update(optimistic);
    setError("");
    setSaving(true);
    const problem = await write();
    setSaving(false);
    if (problem) {
      console.error(problem);
      update(before);
      setError("Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз.");
    }
  }

  function makeEntry(status: ListStatus, score: number | null): ListEntry {
    return { media_id: mediaId, status, score, updated_at: new Date().toISOString() };
  }

  async function saveEntry(next: ListEntry): Promise<string | null> {
    const { error } = await getSupabaseBrowser()
      .from("list_entries")
      .upsert({ media_id: mediaId, status: next.status, score: next.score });
    return error ? error.message : null;
  }

  function entryAfter(base: ListEntry | null, nextMarks: Marks): ListEntry | null {
    return entryAfterMarks(base, nextMarks, { mediaId, total, finished });
  }

  const value: Context = {
    user,
    entry,
    marks,
    saving,
    error,
    airedCount,
    total,

    setStatus(status) {
      const next = makeEntry(status, current?.entry?.score ?? null);
      run({ entry: next }, () => saveEntry(next));
    },

    setScore(score) {
      const next = makeEntry(current?.entry?.status ?? "completed", score);
      run({ entry: next }, () => saveEntry(next));
    },

    remove() {
      run({ entry: null, marks: new Map() }, async () => {
        const supabase = getSupabaseBrowser();
        const [a, b] = await Promise.all([
          supabase.from("list_entries").delete().eq("media_id", mediaId),
          supabase.from("episode_marks").delete().eq("media_id", mediaId),
        ]);
        return a.error?.message ?? b.error?.message ?? null;
      });
    },

    setWatched(episodes, watched) {
      if (!current || episodes.length === 0) return;
      const nextMarks: Marks = new Map(current.marks);
      for (const n of episodes) nextMarks.set(n, { watched, score: nextMarks.get(n)?.score ?? null });
      const nextEntry = entryAfter(current.entry, nextMarks);
      run({ marks: nextMarks, entry: nextEntry }, async () => {
        const { error } = await getSupabaseBrowser()
          .from("episode_marks")
          .upsert(episodes.map((episode) => ({ media_id: mediaId, episode, watched })));
        if (error) return error.message;
        return nextEntry && nextEntry !== current.entry ? saveEntry(nextEntry) : null;
      });
    },

    rateEpisode(episode, score) {
      if (!current) return;
      const nextMarks: Marks = new Map(current.marks);
      // Оцінка серії означає, що її переглянуто.
      const watched = score !== null ? true : (nextMarks.get(episode)?.watched ?? false);
      nextMarks.set(episode, { watched, score });
      const nextEntry = entryAfter(current.entry, nextMarks);
      run({ marks: nextMarks, entry: nextEntry }, async () => {
        const { error } = await getSupabaseBrowser()
          .from("episode_marks")
          .upsert({ media_id: mediaId, episode, watched, score });
        if (error) return error.message;
        return nextEntry && nextEntry !== current.entry ? saveEntry(nextEntry) : null;
      });
    },
  };

  return <UserMediaContext.Provider value={value}>{children}</UserMediaContext.Provider>;
}
