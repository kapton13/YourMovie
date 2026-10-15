"use client";

import { Link, useI18n } from "@/components/i18n/I18nProvider";
import type { MediaCard as Media } from "@/lib/anilist";
import { label as labelOf } from "@/lib/i18n/labels";
import { animeTitle } from "@/lib/i18n/title";
import { formatScore } from "@/lib/labels";
import { Hideable } from "./hidden/Hideable";
import styles from "./MediaCard.module.css";

type Props = {
  media: Media;
  /** Мітка в лівому верхньому куті постера, напр. рік у порядку перегляду. */
  badge?: string;
  /** Підпис над назвою, напр. тип зв'язку («Спін-оф»). */
  label?: string;
  /** Примітка під карткою, напр. чому порадили. */
  note?: string;
  /** Тайтл, на сторінці якого ми зараз: виділяється і не є посиланням. */
  current?: boolean;
  /** Чи можна сховати картку хрестиком «Не цікаво» (типово — так). */
  hideable?: boolean;
};

export function MediaCard({ media, badge, label, note, current, hideable = true }: Props) {
  const { m, fmt, lang } = useI18n();
  const title = animeTitle(media.title, lang) || m.common.untitled;
  const score = formatScore(media.averageScore);
  const meta = [media.format && labelOf(m.labels.format, media.format), media.startDate.year ?? media.seasonYear]
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
          <span className={styles.score} aria-label={fmt(m.home.card.score, { score })}>
            ★ {score}
          </span>
        )}
        {current && <span className={styles.here}>{m.home.card.here}</span>}
      </div>
      {label && <p className={styles.label}>{label}</p>}
      <h3 className={styles.title} title={title}>
        {title}
      </h3>
      {meta && <p className={styles.meta}>{meta}</p>}
      {note && (
        <p className={styles.note} title={note}>
          {note}
        </p>
      )}
    </>
  );

  return current ? (
    <article className={`${styles.card} ${styles.current}`} aria-current="page">
      {content}
    </article>
  ) : (
    <Wrapper enabled={hideable} mediaId={media.id} rootId={media.rootId} title={title}>
      <article className={styles.card}>
        <Link href={`/anime/${media.id}`} className={styles.link}>
          {content}
        </Link>
      </article>
    </Wrapper>
  );
}

function Wrapper({
  enabled,
  mediaId,
  rootId,
  title,
  children,
}: {
  enabled: boolean;
  mediaId: number;
  rootId?: number;
  title: string;
  children: React.ReactNode;
}) {
  return enabled ? (
    <Hideable mediaId={mediaId} rootId={rootId} title={title}>
      {children}
    </Hideable>
  ) : (
    children
  );
}

/** Тексти ряду карток: MediaRow лишається спільним (сервер і браузер передають йому функції), тож тексти — тут. */
export function MediaRowText({ id }: { id: "seeAll" | "empty" }) {
  const { m } = useI18n();
  return m.home.row[id];
}
