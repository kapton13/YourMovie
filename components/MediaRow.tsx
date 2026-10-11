import Link from "next/link";
import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaRow.module.css";

type Props<T extends Media> = {
  title: string;
  /** Якщо задано, заголовок і «Дивитися всі →» ведуть на повний список. */
  href?: string;
  items: T[];
  badge?: (media: T, index: number) => string | undefined;
  label?: (media: T) => string | undefined;
  currentId?: number;
};

export function MediaRow<T extends Media>({ title, href, items, badge, label, currentId }: Props<T>) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{href ? <Link href={href}>{title}</Link> : title}</h2>
        {href && (
          <Link href={href} className={styles.more}>
            Дивитися всі →
          </Link>
        )}
      </div>
      {items.length > 0 ? (
        <div className={styles.row}>
          {items.map((media, index) => (
            <MediaCard
              key={media.id}
              media={media}
              badge={badge?.(media, index)}
              label={label?.(media)}
              current={media.id === currentId}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Поки що тут порожньо.</p>
      )}
    </section>
  );
}
