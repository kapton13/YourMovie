"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import styles from "./ThemeToggle.module.css";

/** Перемикає світлу/темну тему; вибір запам'ятовується в браузері. */
export function ThemeToggle() {
  const { m } = useI18n();
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Браузер не дає зберегти — тема діятиме до перезавантаження сторінки.
    }
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label={m.common.theme.toggle} title={m.common.theme.toggle}>
      <svg className={styles.sun} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
      <svg className={styles.moon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}

/** Виконується до показу сторінки, щоб не було спалаху не тієї теми. */
export const themeInitScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
