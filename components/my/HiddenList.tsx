"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHidden } from "@/components/hidden/HiddenProvider";
import type { Franchise } from "@/lib/anilist";
import styles from "./MyAnime.module.css";

/** Вкладка «Не цікаво»: усе сховане, з кнопкою «Повернути». */
export function HiddenList() {
  const { hiddenKeys, unhide } = useHidden();
  const keys = [...hiddenKeys.keys()].sort((a, b) => a - b);
  const keysParam = keys.join(",");
  const [franchises, setFranchises] = useState<Record<number, Franchise>>({});

  useEffect(() => {
    if (!keysParam) return;
    let cancelled = false;
    fetch(`/api/franchises?ids=${keysParam}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<number, Franchise>) => !cancelled && setFranchises(data))
      .catch((e) => console.warn(e));
    return () => {
      cancelled = true;
    };
  }, [keysParam]);

  if (keys.length === 0)
    return (
      <div className={styles.empty}>
        Тут з’являться аніме, які ви сховали червоним хрестиком ✕. Сайт їх не показує й не рекомендує.
      </div>
    );

  return (
    <>
      <p className={styles.hiddenNote}>Ці аніме сайт не показує на головній, у каталозі й у рекомендаціях.</p>
      <ul className={styles.grid}>
        {keys.map((key) => {
          const franchise = franchises[key];
          const first = franchise?.main[0] ?? franchise?.extras[0];
          return (
            <li key={key}>
              <Link href={`/anime/${key}`} className={styles.card}>
                <span className={`${styles.cardPoster} ${styles.cardHidden}`} style={{ backgroundColor: first?.coverImage.color ?? undefined }}>
                  {first?.coverImage.large && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.coverImage.large} alt="" loading="lazy" />
                  )}
                </span>
                <span className={styles.cardTitle}>{franchise?.title ?? `Аніме #${key}`}</span>
              </Link>
              <button type="button" className={styles.restore} onClick={() => unhide(key)}>
                Повернути
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
