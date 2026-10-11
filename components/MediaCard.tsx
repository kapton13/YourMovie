import Link from "next/link";
import type { MediaCard as Media } from "@/lib/anilist";
import { FORMAT_LABELS, formatScore } from "@/lib/labels";
import styles from "./MediaCard.module.css";

type Props = {
  media: Media;
  /** Мітка в лівому верхньому куті постера, напр. рік у порядку перегляду. */
  badge?: string;
  /** Підпис над назвою, напр. тип зв'язку («Спін-оф»). */
  label?: string;
  /** Тайтл, на сторінці якого ми зараз: виділяється і не є посиланням. */
  current?: boolean;
};

export function MediaCard({ media, badge, label, current }: Props) {
  const title = media.title.english ?? media.title.romaji ?? "Без назви";
  const score = formatScore(media.averageScore);
  const meta = [media.format && FORMAT_LABELS[media.format], media.startDate.year ?? media.seasonYear]
    .filter(Boolean)
    .join(" · ");

  const content = (
    <>
      <div className={styles.poster} style={{ backgroundColor: media.coverImage.color ?? undefined }}>
        {media.coverImage.large && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.coverImage.large} alt="" loading="lazy" />
        )}
        {badge && <span className={styles.badge}>{badge}</span>}
        {score && (
          <span className={styles.score} aria-label={`Рейтинг ${score} з 10`}>
            ★ {score}
          </span>
        )}
        {current && <span className={styles.here}>Ви тут</span>}
      </div>
      {label && <p className={styles.label}>{label}</p>}
      <h3 className={styles.title} title={title}>
        {title}
      </h3>
      {meta && <p className={styles.meta}>{meta}</p>}
    </>
  );

  return current ? (
    <article className={`${styles.card} ${styles.current}`} aria-current="page">
      {content}
    </article>
  ) : (
    <article className={styles.card}>
      <Link href={`/anime/${media.id}`} className={styles.link}>
        {content}
      </Link>
    </article>
  );
}
