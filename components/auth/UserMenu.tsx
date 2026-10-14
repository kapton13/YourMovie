"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "./useProfile";
import { useUser } from "./useUser";
import styles from "./UserMenu.module.css";

/** Праворуч у шапці: «Увійти» або кружечок з першою літерою нікнейму. */
export function UserMenu() {
  const user = useUser();
  const { profile } = useProfile();
  const pathname = usePathname();

  if (user === undefined) return <span className={styles.placeholder} aria-hidden="true" />;

  if (!user) {
    const next = pathname && !["/login", "/signup", "/account"].includes(pathname) ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/login${next}`} className={styles.login} aria-label="Увійти">
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.loginIcon}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
        <span className={styles.loginText}>Увійти</span>
      </Link>
    );
  }

  const name = profile?.nickname ?? user.email ?? "?";
  const letter = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <Link
      href={profile ? `/u/${encodeURIComponent(profile.nickname)}` : "/account"}
      className={styles.avatar}
      title={name}
      aria-label={`Мій профіль (${name})`}
    >
      {letter}
    </Link>
  );
}
