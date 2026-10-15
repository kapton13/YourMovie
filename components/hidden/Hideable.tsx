"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
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
  const ids = rootId && rootId !== mediaId ? [mediaId, rootId] : [mediaId];
  if (ids.some((id) => hiddenIds.has(id) || (skipListed && listedIds.has(id)))) return null;
  if (parentId && hiddenIds.has(parentId)) return null;
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
