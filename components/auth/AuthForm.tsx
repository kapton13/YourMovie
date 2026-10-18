"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Link, useI18n, useLocaleRouter } from "@/components/i18n/I18nProvider";
import { rememberLang } from "@/components/i18n/LanguageSwitcher";
import { hasLocale, localePath, switchLocalePath } from "@/lib/i18n/config";
import { cleanNickname } from "@/lib/profile";
import { safeNext } from "@/lib/safeNext";
import { getSupabaseBrowser, setRemember } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/errors";
import { NicknameField, type NicknameState } from "./NicknameField";
import styles from "./auth.module.css";

type Mode = "login" | "signup" | "forgot";


const MIN_PASSWORD = 8;

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const router = useLocaleRouter();
  const { m, fmt, href, lang } = useI18n();
  const t = m.auth;
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
          ? t.nickname.taken
          : nicknameState === "checking"
            ? t.nicknameChecking
            : t.nicknameRequired,
      );
      return;
    }
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setError(fmt(t.passwordTooShort, { n: MIN_PASSWORD }));
      return;
    }
    setBusy(true);
    const supabase = getSupabaseBrowser();
    // Після посилання з листа — на сторінку тією ж мовою, якою людина зараз користується.
    const callback = (target: string) =>
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(href(target))}`;

    try {
      if (mode === "login") {
        setRemember(remember);
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) return setError(authErrorMessage(error, m));
        // Мова з профілю (обрана на будь-якому пристрої) — одразу туди, одним переходом.
        const { data: profile } = await supabase.from("profiles").select("language").eq("id", data.user.id).maybeSingle();
        const preferred = profile?.language;
        if (hasLocale(preferred) && preferred !== lang) {
          rememberLang(preferred);
          window.location.assign(switchLocalePath(localePath(lang, next), preferred));
          return;
        }
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
        if (error) return setError(authErrorMessage(error, m));
        // Якщо пошта вже зареєстрована, Supabase не каже про це прямо (захист від перебору адрес).
        if (data.user && data.user.identities?.length === 0)
          return setError(t.accountExists);
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
        if (error) return setError(authErrorMessage(error, m));
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
        <h1 className={styles.title}>{t.sent.title}</h1>
        <p className={styles.text}>
          {t.sent.text.split(/(\{email\})/).map((part, i) => (part === "{email}" ? <b key={i}>{sentTo}</b> : part))}{" "}
          {mode === "signup" ? t.sent.signup : t.sent.forgot}
        </p>
        <p className={styles.hint}>{t.sent.hint}</p>
        <button type="button" className={styles.linkButton} onClick={() => setSentTo("")}>
          {t.sent.back}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t.titles[mode]}</h1>
      {mode === "signup" && (
        <p className={styles.text}>{t.intro.signup}</p>
      )}
      {mode === "forgot" && (
        <p className={styles.text}>{t.intro.forgot}</p>
      )}
      {linkProblem && mode === "login" && (
        <p className={styles.notice}>{t.linkProblem}</p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {mode === "signup" && (
          <NicknameField value={nickname} onChange={setNickname} onStateChange={onNicknameState} />
        )}
        <label className={styles.field}>
          <span>{t.email}</span>
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
              <label htmlFor="auth-password">{t.password}</label>
              {mode === "login" && (
                <button type="button" className={styles.linkButton} onClick={() => (setMode("forgot"), setError(""))}>
                  {t.forgotPassword}
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
                aria-label={showPassword ? t.hidePasswordLabel : t.showPasswordLabel}
              >
                {showPassword ? t.hidePassword : t.showPassword}
              </button>
            </span>
            {mode === "signup" && (
              <span id="auth-password-hint" className={styles.hint}>
                {fmt(t.passwordHint, { n: MIN_PASSWORD })}
              </span>
            )}
          </div>
        )}

        {mode === "login" && (
          <label className={styles.remember}>
            <input type="checkbox" checked={remember} onChange={(e) => setRememberChoice(e.target.checked)} />
            <span>
              {t.remember.label}
              <span className={styles.hint}>{remember ? t.remember.on : t.remember.off}</span>
            </span>
          </label>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={busy || !email.trim() || (mode !== "forgot" && !password) || (mode === "signup" && !nickname.trim())}>
          {busy ? t.submit.busy : t.submit[mode]}
        </button>
      </form>

      <p className={styles.switch}>
        {mode === "login" && (
          <>
            {t.switch.noAccount}{" "}
            <Link href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>{t.switch.signup}</Link>
          </>
        )}
        {mode === "signup" && (
          <>
            {t.switch.haveAccount}{" "}
            <Link href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>{t.switch.login}</Link>
          </>
        )}
        {mode === "forgot" && (
          <button type="button" className={styles.linkButton} onClick={() => (setMode("login"), setError(""))}>
            {t.switch.backToLogin}
          </button>
        )}
      </p>
    </div>
  );
}
