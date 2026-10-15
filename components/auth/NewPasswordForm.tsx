"use client";

import { useState } from "react";
import { Link, useI18n, useLocaleRouter } from "@/components/i18n/I18nProvider";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/errors";
import { useUser } from "./useUser";
import styles from "./auth.module.css";

const MIN_PASSWORD = 8;

/** Новий пароль: після посилання з листа «Забули пароль?» або з акаунта. */
export function NewPasswordForm() {
  const user = useUser();
  const router = useLocaleRouter();
  const { m, fmt } = useI18n();
  const t = m.auth.newPassword;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (user === undefined) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.text}>{t.expired}</p>
        <p className={styles.switch}>
          <Link href="/login">{t.toLogin}</Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) return setError(fmt(m.auth.passwordTooShort, { n: MIN_PASSWORD }));
    setBusy(true);
    const { error } = await getSupabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error, m));
    setDone(true);
    setTimeout(() => router.replace("/account"), 1500);
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.text}>{fmt(t.forAccount, { email: user.email ?? "" })}</p>
      {done ? (
        <p className={styles.notice}>{t.done}</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>{t.label}</span>
            <input
              type="password"
              autoComplete="new-password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD}
              required
            />
            <span className={styles.hint}>{fmt(m.auth.passwordHint, { n: MIN_PASSWORD })}</span>
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={busy || !password}>
            {busy ? t.saving : t.save}
          </button>
        </form>
      )}
    </div>
  );
}
