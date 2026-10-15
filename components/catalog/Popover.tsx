"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import styles from "./CatalogControls.module.css";

type Props = {
  /** Назва поля (для читачів екрана й заголовка на телефоні). */
  label: string;
  /** Що показати на кнопці: «Будь-який», «Серіал, Фільм»… */
  summary: string;
  active: boolean;
  wide?: boolean;
  children: React.ReactNode;
};

/**
 * Кнопка з випадною панеллю. На комп'ютері панель під кнопкою,
 * на телефоні — знизу екрана на всю ширину.
 */
export function Popover({ label, summary, active, wide, children }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { m } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.popover}>
      <button
        type="button"
        className={`${styles.control} ${styles.trigger} ${active ? styles.triggerActive : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.triggerText}>{summary}</span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div id={panelId} className={`${styles.panel} ${wide ? styles.panelWide : ""}`} role="dialog" aria-label={label}>
            <div className={styles.panelHeader}>
              <span>{label}</span>
              <button type="button" className={styles.done} onClick={() => setOpen(false)}>
                {m.common.done}
              </button>
            </div>
            <div className={styles.panelBody}>{children}</div>
          </div>
        </>
      )}
    </div>
  );
}
