import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaGrid.module.css";

export function MediaGrid({ items }: { items: Media[] }) {
  return (
    <div className={styles.grid}>
      {items.map((media) => (
        <MediaCard key={media.id} media={media} />
      ))}
    </div>
  );
}
