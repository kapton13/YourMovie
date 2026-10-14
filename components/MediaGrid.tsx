import type { MediaCard as Media } from "@/lib/anilist";
import { MediaCard } from "./MediaCard";
import styles from "./MediaGrid.module.css";

export function MediaGrid<T extends Media>({
  items,
  note,
  badge,
  hideable = true,
}: {
  items: T[];
  note?: (media: T) => string | undefined;
  badge?: (media: T) => string | undefined;
  /** Чи показувати ✕ «Не цікаво» (у чужому профілі — ні: там це чужі списки). */
  hideable?: boolean;
}) {
  return (
    <div className={styles.grid}>
      {items.map((media) => (
        <MediaCard key={media.id} media={media} note={note?.(media)} badge={badge?.(media)} hideable={hideable} />
      ))}
    </div>
  );
}
