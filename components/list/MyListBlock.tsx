"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LIST_STATUSES, LIST_STATUS_LABELS, formatUserScore, type ListStatus } from "@/lib/lists";
import { useHidden } from "@/components/hidden/HiddenProvider";
import { useUserMedia } from "./UserMediaProvider";
import styles from "./MyListBlock.module.css";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** «Мій список» на сторінці аніме: додати, змінити статус, прибрати, оцінити. */
export function MyListBlock({
  seasonLabel,
  mediaId,
  title,
}: {
  seasonLabel?: string;
  mediaId: number;
  title: string;
}) {
  const { user, entry, saving, error, setStatus, setScore, setSeasonScore, seasonScore, seasonAuto, scoreAuto, multipart, remove: removeAll } =
    useUserMedia();
  const pathname = usePathname();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const { hiddenIds, hiddenKeys, hide, unhide } = useHidden();

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

  if (hiddenIds.has(mediaId)) {
    const key = [...hiddenKeys].find(([, ids]) => ids.includes(mediaId))?.[0] ?? mediaId;
    return (
      <div className={`${styles.block} ${styles.hiddenBlock}`}>
        <p className={styles.heading}>✕ Не цікаво</p>
        <p className={styles.muted}>
          Ви позначили це аніме як «Не цікаво» — сайт його не показує й не рекомендує.
        </p>
        <button type="button" className={styles.restore} onClick={() => unhide(key)}>
          Повернути
        </button>
      </div>
    );
  }

  function notInterested() {
    // Якщо аніме у списку — спершу питаємо, бо його буде прибрано разом з оцінками.
    if (entry && !confirmHide) {
      setConfirmHide(true);
      return;
    }
    setConfirmHide(false);
    if (entry) removeAll();
    hide(mediaId, title);
  }

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
          <span>Прибрати це аніме (усі частини) зі списку разом з оцінками й відмітками серій?</span>
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

      <ScoreRow
        label={multipart ? "Оцінка аніме" : "Моя оцінка"}
        score={score}
        onChange={(n) => save({ score: n })}
        ariaLabel="Оцінка всього аніме від 1 до 10"
        auto={
          scoreAuto
            ? multipart
              ? "Середнє оцінок усіх сезонів. Щоб змінити — змініть оцінку сезону."
              : "Середнє оцінок усіх серій. Щоб змінити — змініть оцінку серії."
            : undefined
        }
      />
      {multipart && (
        <ScoreRow
          label={`Оцінка: ${seasonLabel ?? "ця частина"}`}
          score={seasonScore}
          onChange={(n) => (setConfirmRemove(false), setSeasonScore(n))}
          ariaLabel="Оцінка цієї частини від 1 до 10"
          auto={seasonAuto ? "Середнє оцінок усіх серій. Щоб змінити — змініть оцінку серії." : undefined}
        />
      )}
      {!entry && (
        <p className={styles.muted}>
          {multipart ? "Оцінка додасть аніме у ваш список." : "Оцінка додасть аніме до «Переглянуто»."}
        </p>
      )}

      {confirmHide ? (
        <div className={styles.confirm} role="alertdialog" aria-label="Не цікаво?">
          <span>Аніме у вашому списку. Прибрати його звідти (з оцінками й відмітками) і позначити «Не цікаво»?</span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.danger} onClick={notInterested}>
              Так
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmHide(false)}>
              Скасувати
            </button>
          </span>
        </div>
      ) : (
        <button type="button" className={styles.notInterested} onClick={notInterested}>
          ✕ Не цікаво
        </button>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  score,
  onChange,
  ariaLabel,
  auto,
}: {
  label: string;
  score: number | null;
  onChange: (score: number | null) => void;
  ariaLabel: string;
  /** Оцінка рахується сама — пояснення замість ручного вибору. */
  auto?: string;
}) {
  return (
    <div className={styles.scoreRow}>
      <span className={styles.scoreLabel}>
        {label}
        {score !== null && <b className={styles.scoreValue}> {formatUserScore(score)}</b>}
      </span>
      <div className={styles.scores} role="group" aria-label={ariaLabel}>
        {SCORES.map((n) => {
          const active = score !== null && Math.round(score) === n;
          return (
            <button
              key={n}
              type="button"
              className={`${styles.score} ${score !== null && n <= Math.round(score) ? styles.scoreFilled : ""} ${active ? styles.scoreActive : ""}`}
              aria-pressed={active}
              aria-label={
                auto ? `${label}: ${n}` : active ? `${label}: ${n}, натисніть, щоб прибрати` : `${label}: оцінити на ${n}`
              }
              disabled={Boolean(auto)}
              onClick={() => onChange(active ? null : n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      {auto && <p className={styles.autoNote}>{auto}</p>}
    </div>
  );
}
