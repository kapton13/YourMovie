"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const listeners = new Set<() => void>();

/** Повідомити всі компоненти (напр. шапку), що профіль змінився. */
export function notifyProfileChanged() {
  for (const listener of listeners) listener();
}

/** Профіль поточного користувача: undefined — завантажуємо, null — не ввійшов або профілю немає. */
export function useProfile(): { profile: Profile | null | undefined; reload: () => void } {
  const user = useUser();
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null } | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSupabaseBrowser()
      .from("profiles")
      .select("id, user_number, nickname, full_name, phone, country")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setLoaded({ userId: user.id, profile: (data as Profile | null) ?? null });
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
