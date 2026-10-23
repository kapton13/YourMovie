"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const listeners = new Set<() => void>();

/*
 * Профіль потрібен відразу кільком частинам сторінки (шапка, вибір мови, налаштування) — читаємо його з бази
 * один раз на всіх; змінився (`notifyProfileChanged` чи `reload`) — читаємо знову.
 */
let generation = 0;
let cache: { userId: string; generation: number; promise: Promise<Profile | null> } | null = null;

function fetchProfile(userId: string): Promise<Profile | null> {
  if (cache && cache.userId === userId && cache.generation === generation) return cache.promise;
  const promise = Promise.resolve(
    getSupabaseBrowser()
      .from("profiles")
      // Усі поля: так сторінка працює й до оновлення бази (поки немає окремих полів ПІБ).
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
  ).then(({ data, error }) => {
    if (error) {
      console.error(error);
      // Не вдалося — наступного разу спробуємо знову.
      if (cache?.promise === promise) cache = null;
    }
    return (data as Profile | null) ?? null;
  });
  cache = { userId, generation, promise };
  return promise;
}

/** Повідомити всі компоненти (напр. шапку), що профіль змінився. */
export function notifyProfileChanged() {
  generation++;
  for (const listener of listeners) listener();
}

/** Профіль поточного користувача: undefined — завантажуємо, null — не ввійшов або профілю немає. */
export function useProfile(): { profile: Profile | null | undefined; reload: () => void } {
  const user = useUser();
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null } | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const reload = useCallback(() => {
    generation++;
    refresh();
  }, [refresh]);

  useEffect(() => {
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchProfile(user.id).then((profile) => {
      if (!cancelled) setLoaded({ userId: user.id, profile });
    });
    return () => {
      cancelled = true;
    };
  }, [user, version]);

  if (user === undefined) return { profile: undefined, reload };
  if (user === null) return { profile: null, reload };
  // Профіль іншого (попереднього) користувача не показуємо — ще завантажуємо.
  return { profile: loaded?.userId === user.id ? loaded.profile : undefined, reload };
}
