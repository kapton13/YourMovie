"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/errors";
import { useUser } from "./useUser";
import styles from "./auth.module.css";

const MIN_PASSWORD = 8;

/** Новий пароль: після посилання з листа «Забули пароль?» або з акаунта. */
export function NewPasswordForm() {
  const user = useUser();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (user === undefined) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Новий пароль</h1>
        <p className={styles.text}>
          Посилання застаріло або ви не ввійшли. Запросіть новий лист на сторінці входу («Забули пароль?»).
        </p>
        <p className={styles.switch}>
          <Link href="/login">До входу</Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) return setError(`Пароль має бути щонайменше ${MIN_PASSWORD} символів.`);
    setBusy(true);
    const { error } = await getSupabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    setDone(true);
    setTimeout(() => router.replace("/account"), 1500);
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Новий пароль</h1>
      <p className={styles.text}>Для акаунта {user.email}</p>
      {done ? (
        <p className={styles.notice}>Пароль змінено.</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>Новий пароль</span>
            <input
              type="password"
              autoComplete="new-password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD}
              required
            />
            <span className={styles.hint}>Щонайменше {MIN_PASSWORD} символів.</span>
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={busy || !password}>
            {busy ? "Зберігаємо…" : "Зберегти пароль"}
          </button>
        </form>
      )}
    </div>
  );
}
