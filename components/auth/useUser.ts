"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { hasSession, loadSupabase, onUserChange } from "@/lib/supabase/client";

/** Поточний користувач: undefined — ще перевіряємо, null — не ввійшов. */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const off = onUserChange(setUser);
    // Немає cookie входу — гість; бібліотеку Supabase не вантажимо (завантажить форма входу, і тоді
    // `onUserChange` повідомить про вхід).
    const current = hasSession()
      ? loadSupabase()
          .then((supabase) => supabase.auth.getSession())
          .then(({ data }) => data.session?.user ?? null)
      : Promise.resolve(null);
    current.then(setUser);
    return off;
  }, []);

  return user;
}
