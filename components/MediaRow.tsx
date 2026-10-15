import { Link } from "@/components/i18n/I18nProvider";
import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard, MediaRowText } from "./MediaCard";
import styles from "./MediaRow.module.css";

type Props<T extends Media> = {
  title: string;
  /** Якщо задано, заголовок і «Дивитися всі →» ведуть на повний список. */
  href?: string;
  items: T[];
  badge?: (media: T, index: number) => string | undefined;
  label?: (media: T) => string | undefined;
  note?: (media: T) => string | undefined;
  currentId?: number;
  /** Скільки карток показати; решта — запас на випадок, якщо частину сховано. */
  limit?: number;
};

export function MediaRow<T extends Media>({ title, href, items, badge, label, note, currentId, limit }: Props<T>) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{href ? <Link href={href}>{title}</Link> : title}</h2>
        {href && (
          <Link href={href} className={styles.more}>
            <MediaRowText id="seeAll" />
          </Link>
        )}
      </div>
      {items.length > 0 ? (
        <div className={`${styles.row} ${limit === 12 ? styles.limit12 : ""}`}>
          {items.map((media, index) => (
            <MediaCard
              key={media.id}
              media={media}
              badge={badge?.(media, index)}
              label={label?.(media)}
              note={note?.(media)}
              current={media.id === currentId}
              hideable={currentId === undefined}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          <MediaRowText id="empty" />
        </p>
      )}
    </section>
  );
}
