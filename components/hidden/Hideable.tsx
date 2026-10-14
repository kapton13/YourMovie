"use client";

import { useHidden } from "./HiddenProvider";
import { useSkipListed } from "./SkipListed";
import styles from "./Hidden.module.css";

/**
 * Картка аніме з червоним хрестиком «Не цікаво»; сховані картки не показуються зовсім.
 * Усередині `SkipListed` (головна) не показуються й аніме, які вже є в списках.
 */
export function Hideable({ mediaId, title, children }: { mediaId: number; title: string; children: React.ReactNode }) {
  const { hiddenIds, listedIds, loggedIn, hide } = useHidden();
  const skipListed = useSkipListed();
  if (hiddenIds.has(mediaId) || (skipListed && listedIds.has(mediaId))) return null;
  return (
    <div className={styles.hideable}>
      {children}
      {loggedIn && (
        <button
          type="button"
          className={styles.cross}
          onClick={() => hide(mediaId, title)}
          aria-label={`Не цікаво: «${title}» — більше не показувати`}
          title="Не цікаво — більше не показувати"
        >
          ✕
        </button>
      )}
    </div>
  );
}
