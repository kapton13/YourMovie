"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { isCardHidden } from "@/lib/hidden";
import { useHidden } from "./HiddenProvider";
import { useSkipListed } from "./SkipListed";
import styles from "./Hidden.module.css";

/**
 * Картка аніме з червоним хрестиком «Не цікаво»; сховані картки не показуються зовсім.
 * Усередині `SkipListed` (головна) не показуються й аніме, які вже є в списках.
 */
export function Hideable({
  mediaId,
  rootId,
  parentId,
  title,
  children,
}: {
  mediaId: number;
  /** Перша частина аніме (якщо відома): сезон 3 ховається, коли в списку саме аніме. */
  rootId?: number;
  /** Попередня частина: сховано її — ховаємо й цю (новий сезон, спешл). Лише для «Не цікаво». */
  parentId?: number;
  title: string;
  children: React.ReactNode;
}) {
  const { hiddenIds, listedIds, loggedIn, hide } = useHidden();
  const skipListed = useSkipListed();
  const { m, fmt } = useI18n();
  if (isCardHidden({ mediaId, rootId, parentId }, hiddenIds, skipListed ? listedIds : undefined)) return null;
  return (
    <div className={styles.hideable}>
      {children}
      {loggedIn && (
        <button
          type="button"
          className={styles.cross}
          onClick={() => hide(mediaId, title, rootId)}
          aria-label={fmt(m.hidden.crossLabel, { title })}
          title={m.hidden.crossTitle}
        >
          ✕
        </button>
      )}
    </div>
  );
}
