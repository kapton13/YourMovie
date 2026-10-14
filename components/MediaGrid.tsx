import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaGrid.module.css";

export function MediaGrid<T extends Media>({ items, note }: { items: T[]; note?: (media: T) => string | undefined }) {
  return (
    <div className={styles.grid}>
      {items.map((media) => (
        <MediaCard key={media.id} media={media} note={note?.(media)} />
      ))}
    </div>
  );
}
