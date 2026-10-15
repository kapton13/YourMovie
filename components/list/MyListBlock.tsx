"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LIST_STATUSES, type ListStatus } from "@/lib/lists";
import { useHidden } from "@/components/hidden/HiddenProvider";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import { stripLocale } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { useUserMedia } from "./UserMediaProvider";
import styles from "./MyListBlock.module.css";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** «Мій список» на сторінці аніме: додати, змінити статус, прибрати, оцінити. */
export function MyListBlock({
  seasonLabel,
  mediaId,
  rootId,
  title,
}: {
  seasonLabel?: string;
  mediaId: number;
  /** Перша частина аніме: «Не цікаво» ховає всі сезони. */
  rootId?: number;
  title: string;
}) {
  const { user, entry, saving, error, setStatus, setScore, setSeasonScore, seasonScore, seasonAuto, scoreAuto, multipart, remove: removeAll } =
    useUserMedia();
  const pathname = usePathname();
  const { m } = useI18n();
  const t = m.list.block;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const { hiddenIds, hiddenKeys, hide, unhide } = useHidden();

  if (user === undefined || (user && entry === undefined)) {
    // Не вдалося завантажити — кажемо про це, а не крутимо завантаження без кінця.
    if (error)
      return (
        <div className={styles.block}>
          <p className={styles.error} role="alert">
            {m.list.errors[error]}
          </p>
        </div>
      );
    return <div className={`${styles.block} ${styles.loading}`} aria-busy="true" />;
  }

  if (!user) {
    const [before, after] = t.loginText.split("{link}");
    return (
      <div className={styles.block}>
        <p className={styles.heading}>{t.heading}</p>
        <p className={styles.muted}>
          {before}
          <Link href={`/login?next=${encodeURIComponent(stripLocale(pathname ?? "/"))}`} className={styles.link}>
            {t.loginLink}
          </Link>
          {after}
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
        <p className={styles.heading}>{t.hiddenTitle}</p>
        <p className={styles.muted}>{t.hiddenText}</p>
        <button type="button" className={styles.restore} onClick={() => unhide(key)}>
          {t.restore}
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
    hide(mediaId, title, rootId);
  }

  return (
    <div className={styles.block} aria-busy={saving}>
      <div className={styles.headRow}>
        <p className={styles.heading}>{entry ? t.inList : t.add}</p>
        {entry && !confirmRemove && (
          <button type="button" className={styles.removeLink} onClick={() => setConfirmRemove(true)}>
            {t.remove}
          </button>
        )}
      </div>

      {confirmRemove && (
        <div className={styles.confirm} role="alertdialog" aria-label={t.removeAria}>
          <span>{t.removeText}</span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.danger} onClick={remove}>
              {t.removeConfirm}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmRemove(false)}>
              {m.common.cancel}
            </button>
          </span>
        </div>
      )}

      <div className={styles.statuses} role="group" aria-label={t.statusGroup}>
        {LIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.status} ${status === s ? styles.statusActive : ""} ${s === "dropped" ? styles.statusDropped : ""}`}
            aria-pressed={status === s}
            onClick={() => status !== s && save({ status: s as ListStatus })}
          >
            {status === s && <span aria-hidden="true">✓ </span>}
            {m.list.statuses[s]}
          </button>
        ))}
      </div>

      <ScoreRow
        label={multipart ? t.animeScore : t.myScore}
        score={score}
        onChange={(n) => save({ score: n })}
        ariaLabel={t.animeScoreAria}
        auto={scoreAuto ? (multipart ? t.autoSeasons : t.autoEpisodes) : undefined}
      />
      {multipart && (
        <ScoreRow
          label={fmt(t.partScore, { part: seasonLabel ?? t.thisPart })}
          score={seasonScore}
          onChange={(n) => (setConfirmRemove(false), setSeasonScore(n))}
          ariaLabel={t.partScoreAria}
          auto={seasonAuto ? t.autoEpisodes : undefined}
        />
      )}
      {!entry && (
        <p className={styles.muted}>{t.hint}</p>
      )}

      {confirmHide ? (
        <div className={styles.confirm} role="alertdialog" aria-label={t.hideAria}>
          <span>{t.hideText}</span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.danger} onClick={notInterested}>
              {m.common.yes}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmHide(false)}>
              {m.common.cancel}
            </button>
          </span>
        </div>
      ) : (
        <button type="button" className={styles.notInterested} onClick={notInterested}>
          {t.notInterested}
        </button>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {m.list.errors[error]}
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
  const { m, intl } = useI18n();
  const t = m.list.block;
  return (
    <div className={styles.scoreRow}>
      <span className={styles.scoreLabel}>
        {label}
        {score !== null && <b className={styles.scoreValue}> {score.toLocaleString(intl, { maximumFractionDigits: 1 })}</b>}
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
                fmt(auto ? t.scoreAuto : active ? t.scoreRemove : t.scoreRate, { label, n })
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
