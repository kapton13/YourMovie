"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cleanNickname, nicknameProblem } from "@/lib/profile";
import { loadSupabase } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export type NicknameState = "empty" | "invalid" | "checking" | "taken" | "free" | "same";

/** Поле нікнейму з перевіркою «вільний / зайнятий» під час введення. */
export function NicknameField({
  value,
  onChange,
  onStateChange,
  current,
}: {
  value: string;
  onChange: (value: string) => void;
  onStateChange: (state: NicknameState) => void;
  /** Поточний нік (у профілі): його не вважаємо «зайнятим». */
  current?: string;
}) {
  const { m } = useI18n();
  const t = m.auth.nickname;
  const nick = cleanNickname(value);
  const problem = nick ? nicknameProblem(nick) : "";
  // Що відомо одразу, без запиту до бази.
  // Поточний нік — завжди «той самий», навіть якщо це автоматичний «User12».
  const instant: NicknameState | null = !nick
    ? "empty"
    : current && nick.toLowerCase() === current.toLowerCase()
      ? "same"
      : problem
        ? "invalid"
        : null;
  // Відповідь бази для конкретного ніку (стара відповідь до нового ніку не застосовується).
  const [checked, setChecked] = useState<{ nick: string; free: boolean } | null>(null);
  const state: NicknameState =
    instant ?? (checked?.nick === nick ? (checked.free ? "free" : "taken") : "checking");

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  useEffect(() => {
    if (instant) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { data, error } = await (await loadSupabase()).rpc("nickname_available", { nick });
      // Якщо перевірка не вдалася — не блокуємо: остаточно перевірить база під час збереження.
      if (!cancelled) setChecked({ nick, free: Boolean(error) || Boolean(data) });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [nick, instant]);

  const message =
    state === "invalid"
      ? t.problems[problem]
      : state === "taken"
        ? t.taken
        : state === "free"
          ? t.free
          : state === "checking"
            ? t.checking
            : t.rules;

  return (
    <label className={styles.field}>
      <span>{t.label}</span>
      <input
        type="text"
        name="nickname"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        // Із запасом: літери з окремими значками браузер рахує за кілька знаків; точну довжину перевіряємо нижче.
        maxLength={48}
        dir="auto"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${state === "invalid" || state === "taken" ? styles.inputBad : ""}`}
        aria-invalid={state === "invalid" || state === "taken"}
        placeholder={t.placeholder}
      />
      <span
        className={`${styles.hint} ${state === "free" ? styles.hintOk : ""} ${state === "invalid" || state === "taken" ? styles.hintBad : ""}`}
        aria-live="polite"
      >
        {message}
      </span>
    </label>
  );
}
