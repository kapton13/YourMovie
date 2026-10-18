"use client";

import { animeTitle, type Titles } from "@/lib/i18n/title";
import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ListStatus } from "@/lib/lists";
import type { RecEntry, RecReason, RecommendationsResult } from "@/lib/recommendations";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { selectAll } from "@/lib/supabase/selectAll";

type State =
  | { kind: "checking" }
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "error"; retry: () => void }
  | { kind: "ready"; result: RecommendationsResult };

/** Останній результат: між сторінками не перераховуємо, доки списки не змінилися. */
let memo: { key: string; promise: Promise<RecommendationsResult> } | null = null;

async function load(userId: string): Promise<RecommendationsResult> {
  const supabase = getSupabaseBrowser();
  const [entriesRes, hiddenRes] = await Promise.all([
    // Лише свої: відкриті профілі інших людей теж можна читати.
    selectAll((from, to) =>
      supabase.from("list_entries").select("media_id, status, score").eq("user_id", userId).order("media_id").range(from, to),
    ),
    selectAll((from, to) =>
      supabase.from("hidden_media").select("media_id").eq("user_id", userId).order("media_id").range(from, to),
    ),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  const entries: RecEntry[] = (entriesRes.data as { media_id: number; status: ListStatus; score: number | null }[])
    .map((e) => ({ id: e.media_id, status: e.status, score: e.score === null ? null : Number(e.score) }))
    .sort((a, b) => a.id - b.id);
  const hidden = ((hiddenRes.data ?? []) as { media_id: number }[]).map((h) => h.media_id).sort((a, b) => a - b);
  const key = JSON.stringify([userId, entries, hidden]);
  if (!memo || memo.key !== key) {
    const promise = fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, hidden }),
    }).then((res) => {
      if (!res.ok) throw new Error(`recommendations: ${res.status}`);
      return res.json() as Promise<RecommendationsResult>;
    });
    memo = { key, promise };
    promise.catch(() => {
      if (memo?.promise === promise) memo = null;
    });
  }
  return memo.promise;
}

/** Рекомендації для того, хто ввійшов (рахуються на сервері за його списками). */
export function useRecommendations(): State {
  const user = useUser();
  // Порівнюємо за id: після оновлення входу (раз на годину) приходить новий об'єкт того самого користувача.
  const userId = user?.id;
  const [loaded, setLoaded] = useState<{ userId: string; attempt: number; state: State } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // Збій AniList часто минає за кілька секунд — один раз пробуємо ще, перш ніж показати помилку.
    const pause = () => new Promise((r) => setTimeout(r, 3000));
    load(userId)
      .catch(() => pause().then(() => (cancelled ? Promise.reject(new Error("cancelled")) : load(userId))))
      .then((result) => !cancelled && setLoaded({ userId, attempt, state: { kind: "ready", result } }))
      .catch((error) => {
        console.error(error);
        const retry = () => setAttempt((n) => n + 1);
        if (!cancelled) setLoaded({ userId, attempt, state: { kind: "error", retry } });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  if (user === undefined) return { kind: "checking" };
  if (user === null) return { kind: "guest" };
  if (loaded?.userId !== user.id || loaded.attempt !== attempt) return { kind: "loading" };
  return loaded.state;
}

/** Текст «чому порадили» мовою сайту. */
export function useReasonText(): (reason: RecReason) => string {
  const { m, fmt, intl, lang } = useI18n();
  const name = (title: Titles | undefined) => animeTitle(title, lang) || m.common.untitled;
  return (reason) => {
    if (reason.kind === "popular") return m.recs.reason.popular;
    if (reason.kind === "rated") {
      const score = reason.score.toLocaleString(intl, { maximumFractionDigits: 1 });
      return fmt(m.recs.reason.rated, { title: name(reason.title), score });
    }
    const [first, second] = reason.titles;
    return second === undefined
      ? fmt(m.recs.reason.similarOne, { title: name(first) })
      : fmt(m.recs.reason.similarTwo, { first: name(first), second: name(second) });
  };
}
