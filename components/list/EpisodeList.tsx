"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import type { EpisodeInfo, EpisodesData } from "@/lib/anilist";
import { stripLocale } from "@/lib/i18n/config";
import { useUserMedia } from "./UserMediaProvider";
import styles from "./EpisodeList.module.css";

const RANGE = 50;
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** Дата серії цифрами за київським часом, за правилами мови. */
function dateFormat(intl: string): Intl.DateTimeFormat {
  let format = dateFormats.get(intl);
  if (!format) {
    format = new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Kyiv" });
    dateFormats.set(intl, format);
  }
  return format;
}

/** Вставити елемент замість {key} у тексті зі словника. */
function withNode(template: string, key: string, node: React.ReactNode): React.ReactNode {
  const [before, after = ""] = template.split(`{${key}}`);
  return (
    <>
      {before}
      {node}
      {after}
    </>
  );
}

/** Розділ «Серії»: відмітки «переглянуто», «усі до цієї», оцінка кожної серії. */
export function EpisodeList({ data }: { data: EpisodesData }) {
  const { user, marks, saving, error, setWatched, rateEpisode } = useUserMedia();
  const pathname = usePathname();
  const { m, fmt } = useI18n();
  const t = m.list.episodes;
  const { episodes, airedCount } = data;

  const watchedCount = useMemo(() => {
    let n = 0;
    if (marks) for (const [episode, m] of marks) if (m.watched && episode <= episodes.length) n++;
    return n;
  }, [marks, episodes.length]);

  // Довгі серіали — блоками по 50; спершу показуємо блок з першою непереглянутою серією.
  const ranges = Math.ceil(episodes.length / RANGE);
  const firstUnwatched = episodes.find((e) => e.aired && !marks?.get(e.number)?.watched)?.number ?? 1;
  const [chosenRange, setChosenRange] = useState<number | null>(null);
  const range = chosenRange ?? Math.floor((firstUnwatched - 1) / RANGE);
  const [rating, setRating] = useState<number | null>(null);

  if (episodes.length === 0) return null;
  // Фільм чи спешл з однієї серії: лише один рядок, без масових кнопок і смуги прогресу.
  const single = episodes.length === 1;

  const loggedIn = Boolean(user);
  const ready = loggedIn && marks !== undefined;
  const shown = episodes.slice(range * RANGE, range * RANGE + RANGE);
  const aired = episodes.filter((e) => e.aired).map((e) => e.number);
  const allAiredWatched = aired.length > 0 && aired.every((n) => marks?.get(n)?.watched);
  const percent = airedCount > 0 ? Math.min(100, Math.round((watchedCount / airedCount) * 100)) : 0;

  function markUpTo(episode: number) {
    const missing = aired.filter((n) => n <= episode && !marks?.get(n)?.watched);
    setWatched(missing, true);
  }

  return (
    <section className={styles.section} aria-busy={saving}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{single ? t.single : t.heading}</h2>
        {ready && !single && (
          <span className={styles.progressText}>
            {withNode(fmt(t.progress, { aired: airedCount }), "watched", <b>{watchedCount}</b>)}
            {data.total && data.total > airedCount ? fmt(t.total, { n: data.total }) : ""}
          </span>
        )}
        {ready && !single && aired.length > 0 && (
          <button
            type="button"
            className={styles.bulk}
            onClick={() => (allAiredWatched ? setWatched(aired, false) : setWatched(aired.filter((n) => !marks?.get(n)?.watched), true))}
          >
            {allAiredWatched
              ? t.unmarkAll
              : data.total && airedCount >= data.total
                ? t.markSeason
                : t.markAired}
          </button>
        )}
      </div>

      {ready && !single && (
        <div className={styles.progress} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t.progressAria}>
          <span style={{ width: `${percent}%` }} />
        </div>
      )}

      {!loggedIn && user !== undefined && (
        <p className={styles.note}>
          {withNode(
            t.loginText,
            "link",
            <Link href={`/login?next=${encodeURIComponent(stripLocale(pathname ?? "/"))}`}>{t.loginLink}</Link>,
          )}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {m.list.errors[error]}
        </p>
      )}

      {ranges > 1 && (
        <div className={styles.ranges} role="tablist" aria-label={t.rangesAria}>
          {Array.from({ length: ranges }, (_, i) => {
            const from = i * RANGE + 1;
            const to = Math.min(episodes.length, (i + 1) * RANGE);
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === range}
                className={`${styles.range} ${i === range ? styles.rangeActive : ""}`}
                onClick={() => (setChosenRange(i), setRating(null))}
              >
                {from}–{to}
              </button>
            );
          })}
        </div>
      )}

      <ol className={styles.list}>
        {shown.map((episode) => (
          <EpisodeRow
            key={episode.number}
            episode={episode}
            ready={ready}
            watched={Boolean(marks?.get(episode.number)?.watched)}
            score={marks?.get(episode.number)?.score ?? null}
            canMarkUpTo={ready && episode.aired && aired.some((n) => n < episode.number && !marks?.get(n)?.watched)}
            ratingOpen={rating === episode.number}
            onToggle={() => setWatched([episode.number], !marks?.get(episode.number)?.watched)}
            onMarkUpTo={() => markUpTo(episode.number)}
            onOpenRating={() => setRating(rating === episode.number ? null : episode.number)}
            onRate={(score) => (rateEpisode(episode.number, score), setRating(null))}
          />
        ))}
      </ol>
    </section>
  );
}

function EpisodeRow({
  episode,
  ready,
  watched,
  score,
  canMarkUpTo,
  ratingOpen,
  onToggle,
  onMarkUpTo,
  onOpenRating,
  onRate,
}: {
  episode: EpisodeInfo;
  ready: boolean;
  watched: boolean;
  score: number | null;
  canMarkUpTo: boolean;
  ratingOpen: boolean;
  onToggle: () => void;
  onMarkUpTo: () => void;
  onOpenRating: () => void;
  onRate: (score: number | null) => void;
}) {
  const { m, fmt, intl } = useI18n();
  const t = m.list.episodes;
  const date = episode.airingAt ? dateFormat(intl).format(new Date(episode.airingAt * 1000)) : null;
  const name = episode.title ?? fmt(t.episode, { n: episode.number });

  return (
    <li className={`${styles.row} ${watched ? styles.watched : ""} ${episode.aired ? "" : styles.upcoming}`}>
      <div className={styles.main}>
        <span className={styles.number}>{episode.number}</span>
        <span className={styles.info}>
          <span className={styles.title} title={name}>
            {name}
          </span>
          <span className={styles.meta}>
            {date ? (
              <span className={styles.date}>{episode.aired ? date : fmt(t.airs, { date })}</span>
            ) : (
              !episode.aired && <span className={styles.date}>{t.notAired}</span>
            )}
            {ready && canMarkUpTo && (
              <button type="button" className={styles.upTo} onClick={onMarkUpTo} title={t.upToTitle}>
                {t.upTo}
              </button>
            )}
          </span>
        </span>

        {ready && episode.aired && (
          <span className={styles.actions}>
            <button
              type="button"
              className={`${styles.scoreButton} ${score ? styles.scored : ""}`}
              onClick={onOpenRating}
              aria-expanded={ratingOpen}
              aria-label={score ? fmt(t.scoreAria, { n: episode.number, score }) : fmt(t.rateAria, { n: episode.number })}
            >
              {score ? `★ ${score}` : "☆"}
            </button>
            <button
              type="button"
              className={`${styles.check} ${watched ? styles.checkOn : ""}`}
              onClick={onToggle}
              aria-pressed={watched}
              aria-label={fmt(watched ? t.watchedAria : t.markAria, { n: episode.number })}
            >
              {watched ? "✓" : ""}
            </button>
          </span>
        )}
      </div>

      {ratingOpen && (
        <div className={styles.rating} role="group" aria-label={fmt(t.ratingAria, { n: episode.number })}>
          {SCORES.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.ratingButton} ${score !== null && n <= score ? styles.ratingFilled : ""} ${n === score ? styles.ratingActive : ""}`}
              onClick={() => onRate(n)}
              aria-pressed={n === score}
            >
              {n}
            </button>
          ))}
          {score !== null && (
            <button type="button" className={styles.ratingClear} onClick={() => onRate(null)}>
              {t.clear}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
