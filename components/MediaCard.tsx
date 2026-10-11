import type { MediaCard as Media } from "@/lib/anilist";
import { FORMAT_LABELS, formatScore } from "@/lib/labels";
import styles from "./MediaCard.module.css";

export function MediaCard({ media }: { media: Media }) {
  const title = media.title.english ?? media.title.romaji ?? "Без назви";
  const score = formatScore(media.averageScore);
  const meta = [media.format && FORMAT_LABELS[media.format], media.seasonYear]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.card}>
      <div className={styles.poster} style={{ backgroundColor: media.coverImage.color ?? undefined }}>
        {media.coverImage.large && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.coverImage.large} alt="" loading="lazy" />
        )}
        {score && (
          <span className={styles.score} aria-label={`Рейтинг ${score} з 10`}>
            ★ {score}
          </span>
        )}
      </div>
      <h3 className={styles.title} title={title}>
        {title}
      </h3>
      {meta && <p className={styles.meta}>{meta}</p>}
    </article>
  );
}
