"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useUser } from "@/components/auth/useUser";
import type { ListStatus } from "@/lib/lists";
import type { RecEntry, RecommendationsResult } from "@/lib/recommendations";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type State =
  | { kind: "checking" }
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "error" }
  | { kind: "ready"; result: RecommendationsResult };

/** Останній результат: між сторінками не перераховуємо, доки списки не змінилися. */
let memo: { key: string; promise: Promise<RecommendationsResult> } | null = null;

async function load(): Promise<RecommendationsResult> {
  const supabase = getSupabaseBrowser();
  const [entriesRes, hiddenRes] = await Promise.all([
    supabase.from("list_entries").select("media_id, status, score"),
    supabase.from("hidden_media").select("media_id"),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  const entries: RecEntry[] = (entriesRes.data as { media_id: number; status: ListStatus; score: number | null }[])
    .map((e) => ({ id: e.media_id, status: e.status, score: e.score === null ? null : Number(e.score) }))
    .sort((a, b) => a.id - b.id);
  const hidden = ((hiddenRes.data ?? []) as { media_id: number }[]).map((h) => h.media_id).sort((a, b) => a - b);
  const key = JSON.stringify([entries, hidden]);
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
  const [loaded, setLoaded] = useState<{ user: User; state: State } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    load()
      .then((result) => !cancelled && setLoaded({ user, state: { kind: "ready", result } }))
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoaded({ user, state: { kind: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user === undefined) return { kind: "checking" };
  if (user === null) return { kind: "guest" };
  if (loaded?.user !== user) return { kind: "loading" };
  return loaded.state;
}
