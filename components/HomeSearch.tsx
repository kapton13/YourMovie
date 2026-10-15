"use client";

import Form from "next/form";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import styles from "./HomeSearch.module.css";

/** Пошук на головній: відкриває каталог з результатами. */
export function HomeSearch() {
  const { m, href } = useI18n();
  return (
    <div className={styles.wrap}>
      <Form action={href("/catalog")} className={styles.form} role="search">
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          className={styles.input}
          placeholder={m.home.search.placeholder}
          aria-label={m.home.search.label}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button type="submit" className={styles.button}>
          {m.home.search.submit}
        </button>
      </Form>
      <Link href="/catalog" className={styles.more}>
        {m.home.search.advanced}
      </Link>
    </div>
  );
}
