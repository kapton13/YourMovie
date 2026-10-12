"use client";

import { useEffect, useState } from "react";
import { NICKNAME_RULES, nicknameProblem } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
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
  const nick = value.trim();
  const problem = nick ? nicknameProblem(nick) : "";
  // Що відомо одразу, без запиту до бази.
  const instant: NicknameState | null = !nick
    ? "empty"
    : problem
      ? "invalid"
      : current && nick.toLowerCase() === current.toLowerCase()
        ? "same"
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
      const { data, error } = await getSupabaseBrowser().rpc("nickname_available", { nick });
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
      ? problem
      : state === "taken"
        ? "Цей нікнейм уже зайнятий — спробуйте інший."
        : state === "free"
          ? "✓ Нікнейм вільний"
          : state === "checking"
            ? "Перевіряємо…"
            : NICKNAME_RULES;

  return (
    <label className={styles.field}>
      <span>Нікнейм</span>
      <input
        type="text"
        name="nickname"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={24}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${state === "invalid" || state === "taken" ? styles.inputBad : ""}`}
        aria-invalid={state === "invalid" || state === "taken"}
        placeholder="Наприклад, Kapton"
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
