import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaRow.module.css";

export function MediaRow({ title, items }: { title: string; items: Media[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
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
