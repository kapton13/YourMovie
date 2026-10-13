"use client";

import { useHidden } from "./HiddenProvider";
import styles from "./Hidden.module.css";

/** Картка аніме з червоним хрестиком «Не цікаво»; сховані картки не показуються зовсім. */
export function Hideable({ mediaId, title, children }: { mediaId: number; title: string; children: React.ReactNode }) {
  const { hiddenIds, loggedIn, hide } = useHidden();
  if (hiddenIds.has(mediaId)) return null;
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
