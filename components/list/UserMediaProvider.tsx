"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import {
  animeAverage,
  franchiseEntryAfter,
  hasUnwatchedAired,
  mergeStatuses,
  seasonAverage,
  type Mark,
  type Marks,
  type PartInfo,
} from "@/lib/franchiseRules";
import type { ListEntry, ListStatus } from "@/lib/lists";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type EpisodeMark = Mark;

/** Що пішло не так — текст бере компонент зі словника (`m.list.errors`). */
export type UserMediaError = "load" | "save" | "seasons";

/** Що сторінка знає про аніме, до якого належить ця частина. */
export type FranchiseContext = {
  /** id запису всього аніме (найперша основна частина). */
  key: number;
  /** Частина, сторінку якої відкрито. */
  part: PartInfo;
  /** Основні частини (для автостатусів і середньої оцінки). */
  main: PartInfo[];
  /** id усіх частин, разом із побічними. */
  allIds: number[];
};

type Context = {
  user: User | null | undefined;
  /** Запис усього аніме: undefined — завантажуємо, null — аніме немає в списку. */
  entry: ListEntry | null | undefined;
  /** Відмітки серій цієї частини. */
  marks: Marks | undefined;
  /** Оцінка цієї частини (сезону). */
  seasonScore: number | null;
  /** Оцінку сезону пораховано із серій (оцінено всі) — вручну її не змінити. */
  seasonAuto: boolean;
  /** Оцінку аніме пораховано із сезонів (оцінено всі) — вручну її не змінити. */
  scoreAuto: boolean;
  /** Чи має аніме кілька частин (тоді показуємо оцінку сезону окремо). */
  multipart: boolean;
  saving: boolean;
  error: UserMediaError | null;
  airedCount: number;
  total: number | null;
  setStatus: (status: ListStatus) => void;
  setScore: (score: number | null) => void;
  setSeasonScore: (score: number | null) => void;
  remove: () => void;
  setWatched: (episodes: number[], watched: boolean) => void;
  rateEpisode: (episode: number, score: number | null) => void;
};

const UserMediaContext = createContext<Context | null>(null);

export function useUserMedia(): Context {
  const context = useContext(UserMediaContext);
  if (!context) throw new Error("useUserMedia: UserMediaProvider is missing");
  return context;
}

const ENTRY_FIELDS = "media_id, status, score, updated_at";

type Loaded = {
  userId: string;
  entry: ListEntry | null;
  /** Відмітки серій усіх частин аніме. */
  marks: Map<number, Marks>;
  seasonScores: Map<number, number>;
};

export function UserMediaProvider({
  franchise,
  airedCount,
  children,
}: {
  franchise: FranchiseContext;
  airedCount: number;
  children: React.ReactNode;
}) {
  const user = useUser();
  const { key, part: partInfo, main: mainInfo, allIds } = franchise;
  // Скільки серій уже вийшло, ми знаємо точно лише для відкритої частини.
  const part = { ...partInfo, aired: airedCount };
  const main = mainInfo.map((p) => (p.id === part.id ? part : p));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<UserMediaError | null>(null);
  // Збільшуємо, щоб перечитати дані з бази (після невдалого збереження).
  const [version, setVersion] = useState(0);
  const idsKey = allIds.join(",");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    const ids = idsKey.split(",").map(Number);
    (async () => {
      const [entriesRes, marksRes, scoresRes] = await Promise.all([
        // Лише свої: відкриті профілі інших людей теж можна читати.
        supabase.from("list_entries").select(ENTRY_FIELDS).eq("user_id", user.id).in("media_id", ids),
        supabase.from("episode_marks").select("media_id, episode, watched, score").eq("user_id", user.id).in("media_id", ids),
        supabase.from("season_scores").select("media_id, score").eq("user_id", user.id).in("media_id", ids),
      ]);
      if (cancelled) return;
      if (entriesRes.error || marksRes.error) {
        // Без даних нічого не даємо змінювати — інакше збереження затерло б справжні оцінки.
        console.error(entriesRes.error ?? marksRes.error);
        setError("load");
        return;
      }
      // Таблиця оцінок сезонів може ще не існувати — тоді просто без них.
      if (scoresRes.error) console.warn(scoresRes.error);

      const marks = new Map<number, Marks>();
      for (const m of (marksRes.data ?? []) as { media_id: number; episode: number; watched: boolean; score: number | null }[]) {
        if (!marks.has(m.media_id)) marks.set(m.media_id, new Map());
        marks.get(m.media_id)!.set(m.episode, { watched: m.watched, score: m.score });
      }
      const seasonScores = new Map<number, number>();
      for (const s of (scoresRes.data ?? []) as { media_id: number; score: number }[]) seasonScores.set(s.media_id, Number(s.score));

      // Раніше кожен сезон мав свій запис — об'єднуємо в один запис усього аніме.
      const entries = (entriesRes.data ?? []) as ListEntry[];
      let entry = entries.find((e) => e.media_id === key) ?? null;
      const stray = entries.filter((e) => e.media_id !== key);
      if (stray.length > 0) {
        const all = entry ? [entry, ...stray] : stray;
        const merged: ListEntry = {
          media_id: key,
          status: mergeStatuses(all.map((e) => e.status)),
          score: entry?.score ?? stray.find((e) => e.score !== null)?.score ?? null,
          updated_at: new Date().toISOString(),
        };
        const { error: upsertError } = await supabase
          .from("list_entries")
          .upsert({ media_id: key, status: merged.status, score: merged.score });
        if (!upsertError) {
          await supabase.from("list_entries").delete().in("media_id", stray.map((e) => e.media_id));
          entry = merged;
        }
      }

      // Оцінки серій і сезонів мають перевагу над ручними: виправляємо, якщо раніше було інакше.
      const parts = main.some((p) => p.id === part.id) ? main : [...main, part];
      for (const p of parts) {
        const average = seasonAverage(p, marks.get(p.id));
        if (average === null || average === seasonScores.get(p.id)) continue;
        const { error: scoreError } = await supabase.from("season_scores").upsert({ media_id: p.id, score: average });
        if (!scoreError) seasonScores.set(p.id, average);
      }
      const average = animeAverage(main, seasonScores);
      if (entry && average !== null && entry.score !== average) {
        const { error: entryError } = await supabase
          .from("list_entries")
          .upsert({ media_id: key, status: entry.status, score: average });
        if (!entryError) entry = { ...entry, score: average };
      }
      // «Переглянуто», а вийшла нова серія чи є невідмічена → «Дивлюся».
      if (entry?.status === "completed" && hasUnwatchedAired(main, marks)) {
        const { error: entryError } = await supabase
          .from("list_entries")
          .upsert({ media_id: key, status: "watching", score: entry.score });
        if (!entryError) entry = { ...entry, status: "watching" };
      }
      if (!cancelled) setLoaded({ userId: user.id, entry, marks, seasonScores });
    })();
    return () => {
      cancelled = true;
    };
    // part і main приходять із сервера разом з idsKey — окремо не змінюються.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, key, idsKey, version]);

  const current = user && loaded?.userId === user.id ? loaded : null;
  const entry = user === null ? null : current ? current.entry : undefined;

  /** Виконати зміну оптимістично; якщо база відмовила — повернути як було. */
  async function run(next: Partial<Omit<Loaded, "userId">>, write: () => Promise<string | null>) {
    if (!current) return;
    const before = current;
    setLoaded({ ...current, ...next });
    setError(null);
    setSaving(true);
    const problem = await write();
    setSaving(false);
    if (problem) {
      console.error(problem);
      // Частину могло вже бути збережено — показуємо як було й перечитуємо з бази, як є насправді.
      setLoaded(before);
      setVersion((v) => v + 1);
      setError("save");
    }
  }

  async function saveEntry(next: ListEntry): Promise<string | null> {
    const { error } = await getSupabaseBrowser()
      .from("list_entries")
      .upsert({ media_id: key, status: next.status, score: next.score });
    return error ? error.message : null;
  }

  async function saveSeasonScore(score: number | null): Promise<string | null> {
    const table = getSupabaseBrowser().from("season_scores");
    const { error } =
      score === null
        ? await table.delete().eq("media_id", part.id)
        : await table.upsert({ media_id: part.id, score });
    return error ? error.message : null;
  }

  /** Після змін у серіях цієї частини: оцінка сезону й запис аніме за правилами. */
  function afterMarks(partMarks: Marks) {
    if (!current) return null;
    const marks = new Map(current.marks).set(part.id, partMarks);
    const seasonScores = new Map(current.seasonScores);
    const stored = seasonScores.get(part.id) ?? null;
    const previous = seasonAverage(part, current.marks.get(part.id));
    // Оцінено всі серії → оцінка сезону = середнє. Перестали бути оціненими всі, а оцінка
    // сезону була саме тим середнім (не ручна) → прибираємо її.
    let average = seasonAverage(part, partMarks);
    if (average === null && (previous === null || stored !== previous)) average = stored;
    const seasonChanged = average !== stored;
    if (average === null) seasonScores.delete(part.id);
    else seasonScores.set(part.id, average);
    const nextEntry = franchiseEntryAfter({
      key,
      entry: current.entry,
      main,
      marks,
      seasonScores,
      before: current.seasonScores,
    });
    return { marks, seasonScores, nextEntry, seasonChanged, average };
  }

  async function persistAfter(
    result: NonNullable<ReturnType<typeof afterMarks>>,
    writeMarks: () => PromiseLike<{ error: { message: string } | null }>,
  ): Promise<string | null> {
    const { error } = await writeMarks();
    if (error) return error.message;
    if (result.seasonChanged) {
      const problem = await saveSeasonScore(result.average);
      if (problem) return problem;
    }
    if (result.nextEntry && result.nextEntry !== current?.entry) return saveEntry(result.nextEntry);
    return null;
  }

  const partMarks = current?.marks.get(part.id);
  const seasonAuto = seasonAverage(part, partMarks) !== null;
  const autoScore = current ? animeAverage(main, current.seasonScores) : null;

  const value: Context = {
    user,
    entry,
    marks: current?.marks.get(part.id) ?? (current ? new Map() : undefined),
    seasonScore: current?.seasonScores.get(part.id) ?? null,
    seasonAuto,
    scoreAuto: autoScore !== null,
    multipart: allIds.length > 1,
    saving,
    error,
    airedCount,
    total: part.episodes,

    setStatus(status) {
      const next: ListEntry = { media_id: key, status, score: current?.entry?.score ?? null, updated_at: new Date().toISOString() };
      if (status !== "completed" || !current) {
        run({ entry: next }, () => saveEntry(next));
        return;
      }
      // «Переглянуто» вручну: усі серії, що вже вийшли, вважаємо переглянутими.
      // Тоді з виходом нового сезону аніме саме повернеться в «Дивлюся» лише з новими серіями.
      const base = current;
      const complete = (airedOther: Map<number, number>) => {
        const marks = new Map(base.marks);
        const rows: { media_id: number; episode: number; watched: boolean }[] = [];
        // Невідомо, з чого складається аніме, — відмічаємо хоча б відкриту частину.
        for (const p of main.length > 0 ? main : [part]) {
          const aired =
            p.id === part.id
              ? airedCount
              : (airedOther.get(p.id) ?? (p.status === "FINISHED" || p.status === "CANCELLED" ? (p.episodes ?? 0) : 0));
          const partMarks: Marks = new Map(marks.get(p.id));
          for (let n = 1; n <= aired; n++) {
            if (partMarks.get(n)?.watched) continue;
            partMarks.set(n, { watched: true, score: partMarks.get(n)?.score ?? null });
            rows.push({ media_id: p.id, episode: n, watched: true });
          }
          marks.set(p.id, partMarks);
        }
        run({ entry: next, marks }, async () => {
          if (rows.length) {
            const { error } = await getSupabaseBrowser().from("episode_marks").upsert(rows);
            if (error) return error.message;
          }
          return saveEntry(next);
        });
      };
      // Інші сезони, що зараз виходять: скільки серій уже вийшло, дізнаємося в AniList.
      const airing = main.filter(
        (p) => p.id !== part.id && p.status !== "FINISHED" && p.status !== "CANCELLED" && p.status !== "NOT_YET_RELEASED",
      );
      if (airing.length === 0) {
        complete(new Map());
        return;
      }
      setSaving(true);
      fetch(`/api/my-media?ids=${airing.map((p) => p.id).join(",")}`)
        .then((res) => {
          if (!res.ok) throw new Error(`my-media ${res.status}`);
          return res.json() as Promise<{ id: number; airedCount: number }[]>;
        })
        .then((data) => complete(new Map(data.map((m) => [m.id, m.airedCount]))))
        .catch((e) => {
          // Не знаємо, скільки серій вийшло в інших сезонах, — не ставимо «Переглянуто» навмання.
          console.error(e);
          setSaving(false);
          setError("seasons");
        });
    },

    setScore(score) {
      // Оцінено всі сезони — оцінка аніме рахується сама.
      if (autoScore !== null || !current) return;
      // Оцінка сама «Переглянуто» не ставить: нове аніме — у «Дивлюся» (якщо не все вже переглянуто).
      const base: ListEntry = current.entry ?? { media_id: key, status: "watching", score: null, updated_at: "" };
      const next =
        franchiseEntryAfter({ key, entry: { ...base, score }, main, marks: current.marks, seasonScores: current.seasonScores }) ??
        base;
      run({ entry: next }, () => saveEntry(next));
    },

    setSeasonScore(score) {
      // Оцінено всі серії — оцінка сезону рахується сама.
      if (!current || seasonAuto) return;
      const seasonScores = new Map(current.seasonScores);
      if (score === null) seasonScores.delete(part.id);
      else seasonScores.set(part.id, score);
      // Оцінка сама «Переглянуто» не ставить: нове аніме — у «Дивлюся».
      const base = current.entry ?? { media_id: key, status: "watching" as ListStatus, score: null, updated_at: "" };
      const nextEntry = franchiseEntryAfter({
        key,
        entry: base,
        main,
        marks: current.marks,
        seasonScores,
        before: current.seasonScores,
      });
      run({ seasonScores, entry: nextEntry }, async () => {
        const problem = await saveSeasonScore(score);
        if (problem) return problem;
        return nextEntry && (nextEntry !== current.entry || !current.entry) ? saveEntry(nextEntry) : null;
      });
    },

    remove() {
      run({ entry: null, marks: new Map(), seasonScores: new Map() }, async () => {
        const supabase = getSupabaseBrowser();
        const ids = allIds;
        const results = await Promise.all([
          supabase.from("list_entries").delete().in("media_id", ids),
          supabase.from("episode_marks").delete().in("media_id", ids),
          supabase.from("season_scores").delete().in("media_id", ids),
        ]);
        return results.find((r) => r.error && r.error.code !== "PGRST205")?.error?.message ?? null;
      });
    },

    setWatched(episodes, watched) {
      if (!current || episodes.length === 0) return;
      const partMarks: Marks = new Map(current.marks.get(part.id));
      // Зняли відмітку «переглянуто» — оцінка серії теж зникає.
      for (const n of episodes) partMarks.set(n, { watched, score: watched ? (partMarks.get(n)?.score ?? null) : null });
      const result = afterMarks(partMarks)!;
      run({ marks: result.marks, seasonScores: result.seasonScores, entry: result.nextEntry }, () =>
        persistAfter(result, () =>
          getSupabaseBrowser()
            .from("episode_marks")
            .upsert(
              episodes.map((episode) =>
                watched ? { media_id: part.id, episode, watched } : { media_id: part.id, episode, watched, score: null },
              ),
            ),
        ),
      );
    },

    rateEpisode(episode, score) {
      if (!current) return;
      const partMarks: Marks = new Map(current.marks.get(part.id));
      // Оцінка серії означає, що її переглянуто.
      const watched = score !== null ? true : (partMarks.get(episode)?.watched ?? false);
      partMarks.set(episode, { watched, score });
      const result = afterMarks(partMarks)!;
      run({ marks: result.marks, seasonScores: result.seasonScores, entry: result.nextEntry }, () =>
        persistAfter(result, () =>
          getSupabaseBrowser().from("episode_marks").upsert({ media_id: part.id, episode, watched, score }),
        ),
      );
    },
  };

  return <UserMediaContext.Provider value={value}>{children}</UserMediaContext.Provider>;
}
