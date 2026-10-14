"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cleanNickname } from "@/lib/profile";
import { safeNext } from "@/lib/safeNext";
import { getSupabaseBrowser, setRemember } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/errors";
import { NicknameField, type NicknameState } from "./NicknameField";
import styles from "./auth.module.css";

type Mode = "login" | "signup" | "forgot";


const MIN_PASSWORD = 8;

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const linkProblem = searchParams.get("error") === "link";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRememberChoice] = useState(true);
  const [nickname, setNickname] = useState("");
  const [nicknameState, setNicknameState] = useState<NicknameState>("empty");
  const onNicknameState = useCallback((state: NicknameState) => setNicknameState(state), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (mode === "signup" && nicknameState !== "free") {
      setError(
        nicknameState === "taken"
          ? "Цей нікнейм уже зайнятий — спробуйте інший."
          : nicknameState === "checking"
            ? "Зачекайте секунду: перевіряємо нікнейм."
            : "Вкажіть нікнейм: 3–24 символи, літери, цифри, _ . -",
      );
      return;
    }
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setError(`Пароль має бути щонайменше ${MIN_PASSWORD} символів.`);
      return;
    }
    setBusy(true);
    const supabase = getSupabaseBrowser();
    const callback = (target: string) =>
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;

    try {
      if (mode === "login") {
        setRemember(remember);
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) return setError(authErrorMessage(error));
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        // Новий акаунт — «залишатися в системі» (а не як при минулому вході без цієї галочки).
        setRemember(true);
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: callback(next === "/account" ? "/account?welcome=1" : next),
            data: { nickname: cleanNickname(nickname) },
          },
        });
        if (error) return setError(authErrorMessage(error));
        // Якщо пошта вже зареєстрована, Supabase не каже про це прямо (захист від перебору адрес).
        if (data.user && data.user.identities?.length === 0)
          return setError("Акаунт із цією поштою вже існує. Спробуйте увійти.");
        if (data.session) {
          // Підтвердження пошти вимкнено — людина вже в системі.
          router.replace(next === "/account" ? "/account?welcome=1" : next);
          router.refresh();
          return;
        }
        setSentTo(cleanEmail);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: callback("/reset-password"),
        });
        if (error) return setError(authErrorMessage(error));
        setSentTo(cleanEmail);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          ✉
        </div>
        <h1 className={styles.title}>Перевірте пошту</h1>
        <p className={styles.text}>
          Ми надіслали лист на <b>{sentTo}</b>.{" "}
          {mode === "signup"
            ? "Перейдіть за посиланням у листі, щоб підтвердити пошту й завершити реєстрацію."
            : "Перейдіть за посиланням у листі, щоб задати новий пароль."}
        </p>
        <p className={styles.hint}>Листа немає кілька хвилин? Загляньте в «Спам» або «Промоакції».</p>
        <button type="button" className={styles.linkButton} onClick={() => setSentTo("")}>
          ← Назад
        </button>
      </div>
    );
  }

  const titles: Record<Mode, string> = {
    login: "Вхід",
    signup: "Реєстрація",
    forgot: "Відновлення пароля",
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{titles[mode]}</h1>
      {mode === "signup" && (
        <p className={styles.text}>Створіть акаунт, щоб вести списки аніме, ставити оцінки й відмічати серії.</p>
      )}
      {mode === "forgot" && (
        <p className={styles.text}>Вкажіть пошту акаунта — ми надішлемо посилання для нового пароля.</p>
      )}
      {linkProblem && mode === "login" && (
        <p className={styles.notice}>
          Посилання з листа не спрацювало або застаріло. Якщо пошту вже підтверджено — просто увійдіть.
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {mode === "signup" && (
          <NicknameField value={nickname} onChange={setNickname} onStateChange={onNicknameState} />
        )}
        <label className={styles.field}>
          <span>Пошта</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="you@example.com"
          />
        </label>

        {mode !== "forgot" && (
          <div className={styles.field}>
            <span className={styles.fieldRow}>
              <label htmlFor="auth-password">Пароль</label>
              {mode === "login" && (
                <button type="button" className={styles.linkButton} onClick={() => (setMode("forgot"), setError(""))}>
                  Забули пароль?
                </button>
              )}
            </span>
            <span className={styles.passwordWrap}>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                aria-describedby={mode === "signup" ? "auth-password-hint" : undefined}
              />
              <button
                type="button"
                className={styles.showPassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
              >
                {showPassword ? "Сховати" : "Показати"}
              </button>
            </span>
            {mode === "signup" && (
              <span id="auth-password-hint" className={styles.hint}>
                Щонайменше {MIN_PASSWORD} символів.
              </span>
            )}
          </div>
        )}

        {mode === "login" && (
          <label className={styles.remember}>
            <input type="checkbox" checked={remember} onChange={(e) => setRememberChoice(e.target.checked)} />
            <span>
              Залишатися в системі
              <span className={styles.hint}>
                {remember
                  ? "Не доведеться входити щоразу, навіть після закриття браузера."
                  : "Вихід відбудеться, щойно ви закриєте браузер. Зручно на чужому комп'ютері."}
              </span>
            </span>
          </label>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={busy || !email.trim() || (mode !== "forgot" && !password) || (mode === "signup" && !nickname.trim())}>
          {busy ? "Зачекайте…" : mode === "login" ? "Увійти" : mode === "signup" ? "Зареєструватися" : "Надіслати посилання"}
        </button>
      </form>

      <p className={styles.switch}>
        {mode === "login" && (
          <>
            Ще немає акаунта? <Link href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Зареєструватися</Link>
          </>
        )}
        {mode === "signup" && (
          <>
            Уже є акаунт? <Link href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Увійти</Link>
          </>
        )}
        {mode === "forgot" && (
          <button type="button" className={styles.linkButton} onClick={() => (setMode("login"), setError(""))}>
            ← Повернутися до входу
          </button>
        )}
      </p>
    </div>
  );
}
