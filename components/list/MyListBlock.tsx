"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LIST_STATUSES, LIST_STATUS_LABELS, formatUserScore, type ListStatus } from "@/lib/lists";
import { useUserMedia } from "./UserMediaProvider";
import styles from "./MyListBlock.module.css";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** «Мій список» на сторінці аніме: додати, змінити статус, прибрати, оцінити. */
export function MyListBlock() {
  const { user, entry, saving, error, setStatus, setScore, remove: removeAll } = useUserMedia();
  const pathname = usePathname();
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (user === undefined || (user && entry === undefined)) {
    return <div className={`${styles.block} ${styles.loading}`} aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className={styles.block}>
        <p className={styles.heading}>Мій список</p>
        <p className={styles.muted}>
          <Link href={`/login?next=${encodeURIComponent(pathname ?? "/")}`} className={styles.link}>
            Увійдіть
          </Link>
          , щоб додати аніме у свій список, відмічати серії й ставити оцінки.
        </p>
      </div>
    );
  }

  function save(next: { status?: ListStatus; score?: number | null }) {
    setConfirmRemove(false);
    if (next.status) setStatus(next.status);
    if (next.score !== undefined) setScore(next.score);
  }

  function remove() {
    setConfirmRemove(false);
    removeAll();
  }

  const status = entry?.status;
  const score = entry?.score ?? null;

  return (
    <div className={styles.block} aria-busy={saving}>
      <div className={styles.headRow}>
        <p className={styles.heading}>{entry ? "У моєму списку" : "Додати в мій список"}</p>
        {entry && !confirmRemove && (
          <button type="button" className={styles.removeLink} onClick={() => setConfirmRemove(true)}>
            Прибрати зі списку
          </button>
        )}
      </div>

      {confirmRemove && (
        <div className={styles.confirm} role="alertdialog" aria-label="Прибрати зі списку?">
          <span>Прибрати це аніме зі списку разом з оцінкою й відмітками серій?</span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.danger} onClick={remove}>
              Прибрати
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmRemove(false)}>
              Скасувати
            </button>
          </span>
        </div>
      )}

      <div className={styles.statuses} role="group" aria-label="Статус">
        {LIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.status} ${status === s ? styles.statusActive : ""} ${s === "dropped" ? styles.statusDropped : ""}`}
            aria-pressed={status === s}
            onClick={() => status !== s && save({ status: s as ListStatus })}
          >
            {status === s && <span aria-hidden="true">✓ </span>}
            {LIST_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>
          Моя оцінка{score !== null && <b className={styles.scoreValue}> {formatUserScore(score)}</b>}
        </span>
        <div className={styles.scores} role="group" aria-label="Моя оцінка від 1 до 10">
          {SCORES.map((n) => {
            const active = score !== null && Math.round(score) === n;
            return (
              <button
                key={n}
                type="button"
                className={`${styles.score} ${score !== null && n <= Math.round(score) ? styles.scoreFilled : ""} ${active ? styles.scoreActive : ""}`}
                aria-pressed={active}
                aria-label={active ? `Оцінка ${n}, натисніть, щоб прибрати` : `Оцінити на ${n}`}
                onClick={() => save({ score: active ? null : n })}
              >
                {n}
              </button>
            );
          })}
        </div>
        {!entry && <span className={styles.muted}>Оцінка додасть аніме до «Переглянуто».</span>}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
