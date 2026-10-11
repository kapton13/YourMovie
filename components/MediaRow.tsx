import Link from "next/link";
import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaRow.module.css";

export function MediaRow({ title, href, items }: { title: string; href: string; items: Media[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          <Link href={href}>{title}</Link>
        </h2>
        <Link href={href} className={styles.more}>
          Дивитися всі →
        </Link>
      </div>
      {items.length > 0 ? (
        <div className={styles.row}>
          {items.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Поки що тут порожньо.</p>
      )}
    </section>
  );
}
