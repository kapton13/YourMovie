"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { LIST_STATUSES, LIST_STATUS_LABELS, formatUserScore, type ListEntry, type ListStatus } from "@/lib/lists";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./MyListBlock.module.css";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** «Мій список» на сторінці аніме: додати, змінити статус, прибрати, оцінити. */
export function MyListBlock({ mediaId }: { mediaId: number }) {
  const user = useUser();
  const pathname = usePathname();
  // undefined — ще завантажуємо, null — аніме немає в списку
  const [entry, setEntry] = useState<ListEntry | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSupabaseBrowser()
      .from("list_entries")
      .select("media_id, status, score, updated_at")
      .eq("media_id", mediaId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(error);
          setError("Не вдалося завантажити ваш список. Оновіть сторінку.");
        }
        setEntry((data as ListEntry | null) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, mediaId]);

  if (user === undefined || (user && entry === undefined)) {
    return <div className={`${styles.block} ${styles.loading}`} aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className={styles.block}>
        <p className={styles.heading}>Мій список</p>
        <p className={styles.muted}>
          <Link href={`/login?next=${encodeURIComponent(pathname ?? "/")}`} className={styles.link}>
            Увійдіть
          </Link>
          , щоб додати аніме у свій список і поставити оцінку.
        </p>
      </div>
    );
  }

  /** Зберегти зміни; при помилці повернути як було. */
  async function save(next: Partial<Pick<ListEntry, "status" | "score">>) {
    const previous = entry ?? null;
    const optimistic: ListEntry = {
      media_id: mediaId,
      status: next.status ?? previous?.status ?? "completed",
      score: next.score !== undefined ? next.score : (previous?.score ?? null),
      updated_at: new Date().toISOString(),
    };
    setEntry(optimistic);
    setError("");
    setConfirmRemove(false);
    setSaving(true);
    const { data, error } = await getSupabaseBrowser()
      .from("list_entries")
      .upsert({ media_id: mediaId, status: optimistic.status, score: optimistic.score })
      .select("media_id, status, score, updated_at")
      .single();
    setSaving(false);
    if (error) {
      console.error(error);
      setEntry(previous);
      setError("Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз.");
      return;
    }
    setEntry(data as ListEntry);
  }

  async function remove() {
    const previous = entry ?? null;
    setEntry(null);
    setConfirmRemove(false);
    setError("");
    setSaving(true);
    const { error } = await getSupabaseBrowser().from("list_entries").delete().eq("media_id", mediaId);
    setSaving(false);
    if (error) {
      console.error(error);
      setEntry(previous);
      setError("Не вдалося прибрати зі списку. Спробуйте ще раз.");
    }
  }

  const status = entry?.status;
  const score = entry?.score ?? null;

  return (
    <div className={styles.block} aria-busy={saving}>
      <div className={styles.headRow}>
        <p className={styles.heading}>{entry ? "У моєму списку" : "Додати в мій список"}</p>
        {entry && !confirmRemove && (
          <button type="button" className={styles.removeLink} onClick={() => setConfirmRemove(true)}>
            Прибрати зі списку
          </button>
        )}
      </div>

      {confirmRemove && (
        <div className={styles.confirm} role="alertdialog" aria-label="Прибрати зі списку?">
          <span>Прибрати це аніме зі списку разом з оцінкою?</span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.danger} onClick={remove}>
              Прибрати
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmRemove(false)}>
              Скасувати
            </button>
          </span>
        </div>
      )}

      <div className={styles.statuses} role="group" aria-label="Статус">
        {LIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.status} ${status === s ? styles.statusActive : ""} ${s === "dropped" ? styles.statusDropped : ""}`}
            aria-pressed={status === s}
            onClick={() => status !== s && save({ status: s as ListStatus })}
          >
            {status === s && <span aria-hidden="true">✓ </span>}
            {LIST_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>
          Моя оцінка{score !== null && <b className={styles.scoreValue}> {formatUserScore(score)}</b>}
        </span>
        <div className={styles.scores} role="group" aria-label="Моя оцінка від 1 до 10">
          {SCORES.map((n) => {
            const active = score !== null && Math.round(score) === n;
            return (
              <button
                key={n}
                type="button"
                className={`${styles.score} ${score !== null && n <= Math.round(score) ? styles.scoreFilled : ""} ${active ? styles.scoreActive : ""}`}
                aria-pressed={active}
                aria-label={active ? `Оцінка ${n}, натисніть, щоб прибрати` : `Оцінити на ${n}`}
                onClick={() => save({ score: active ? null : n })}
              >
                {n}
              </button>
            );
          })}
        </div>
        {!entry && <span className={styles.muted}>Оцінка додасть аніме до «Переглянуто».</span>}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
