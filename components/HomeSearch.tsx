import Form from "next/form";
import Link from "next/link";
import styles from "./HomeSearch.module.css";

/** Пошук на головній: відкриває каталог з результатами. */
export function HomeSearch() {
  return (
    <div className={styles.wrap}>
      <Form action="/catalog" className={styles.form} role="search">
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          className={styles.input}
          placeholder="Назва аніме…"
          aria-label="Пошук аніме за назвою"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button type="submit" className={styles.button}>
          Знайти
        </button>
      </Form>
      <Link href="/catalog" className={styles.more}>
        Розширений пошук: жанри, роки, формат та інші фільтри →
      </Link>
    </div>
  );
}
