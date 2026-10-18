"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/components/auth/useProfile";
import {
  LANG_COOKIE,
  LOCALES,
  LOCALE_INFO,
  cookieLang,
  hasLocale,
  isAuthPage,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "./I18nProvider";
import styles from "./LanguageSwitcher.module.css";

export function rememberLang(lang: Locale) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Відкрити поточну сторінку іншою мовою — повним перезавантаженням: мова — це корінь сайту, і частина стану
 * (користувач, списки, «Не цікаво») інакше лишалася б від старої сторінки. `replace`: «Назад» веде на попередню
 * сторінку, а не на цю ж старою мовою.
 */
export function reloadIn(lang: Locale) {
  const { pathname, search, hash } = window.location;
  window.location.replace(switchLocalePath(pathname, lang) + search + hash);
}

/**
 * Змінити мову сайту: запам'ятати (cookie, а для того, хто ввійшов, — у профілі) і відкрити ту саму
 * сторінку новою мовою. Використовують перемикач у шапці й налаштування профілю.
 */
export function useSwitchLanguage() {
  const { lang } = useI18n();
  return async (next: Locale): Promise<boolean> => {
    if (next === lang) return true;
    let ok = true;
    // Хто ввійшов — дізнаємося в момент вибору (профіль у компоненті міг ще не завантажитися).
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (userId) {
      const { error } = await supabase.from("profiles").update({ language: next }).eq("id", userId);
      // Мова листів (підтвердження, новий пароль) — шаблони Supabase читають її з user_metadata.
      if (!error) await supabase.auth.updateUser({ data: { language: next } }).catch(() => null);
      if (error) {
        console.warn(error);
        ok = false;
        // Не зберіглося в профілі — не міняємо мову, інакше мова профілю одразу поверне стару.
        return ok;
      }
    }
    rememberLang(next);
    reloadIn(next);
    return ok;
  };
}

/** Мова в шапці: список мов; вибір запам'ятовується (cookie, а для того, хто ввійшов, — у профілі). */
export function LanguageSwitcher() {
  const { lang, m } = useI18n();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Мова з профілю діє на всіх пристроях: обрали іншу на іншому пристрої — переходимо на неї
  // (крім сторінок входу: вони після входу самі ведуть на мову профілю).
  const preferred = profile?.language;
  useEffect(() => {
    if (hasLocale(preferred) && preferred !== lang && !isAuthPage(window.location.pathname)) {
      rememberLang(preferred);
      reloadIn(preferred);
    }
  }, [preferred, lang]);

  // Сторінку взято з пам'яті браузера (кнопка «Назад», без запиту до сервера, який би сам переадресував) —
  // перевіряємо обрану мову тут: під час відкриття й під час відновлення сторінки.
  useEffect(() => {
    const check = () => {
      const chosen = cookieLang(document.cookie);
      if (chosen && chosen !== lang) reloadIn(chosen);
    };
    check();
    const onShow = (event: PageTransitionEvent) => event.persisted && check();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [lang]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const switchLanguage = useSwitchLanguage();

  function choose(next: Locale) {
    setOpen(false);
    switchLanguage(next);
  }

  return (
    <div className={styles.box} ref={box}>
      <button
        type="button"
        className={styles.button}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${m.common.language.label}: ${LOCALE_INFO[lang].name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.globe}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        <span className={styles.code}>{LOCALE_INFO[lang].short}</span>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label={m.common.language.label}>
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === lang}
                lang={l}
                className={`${styles.option} ${l === lang ? styles.optionActive : ""}`}
                onClick={() => choose(l)}
              >
                <span>{LOCALE_INFO[l].name}</span>
                <span className={styles.optionCode}>{LOCALE_INFO[l].short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
