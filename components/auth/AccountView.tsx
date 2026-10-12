"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useUser } from "./useUser";
import styles from "./auth.module.css";

export function AccountView() {
  const user = useUser();
  const router = useRouter();
  const welcome = useSearchParams().get("welcome") === "1";
  const [busy, setBusy] = useState(false);

  if (user === undefined) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Мій акаунт</h1>
        <p className={styles.text}>Ви не ввійшли.</p>
        <p className={styles.switch}>
          <Link href="/login">Увійти</Link> або <Link href="/signup">зареєструватися</Link>
        </p>
      </div>
    );
  }

  const since = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(user.created_at),
  );

  async function signOut() {
    setBusy(true);
    await getSupabaseBrowser().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className={styles.card}>
      {welcome && <p className={styles.notice}>Ласкаво просимо до YourMovie! Акаунт створено.</p>}
      <h1 className={styles.title}>Мій акаунт</h1>
      <dl className={styles.details}>
        <div>
          <dt>Пошта</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>З нами з</dt>
          <dd>{since}</dd>
        </div>
      </dl>
      <p className={styles.text}>
        Незабаром тут з’являться ваші списки, оцінки й відмічені серії.
      </p>
      <div className={styles.actions}>
        <Link href="/reset-password" className={styles.secondary}>
          Змінити пароль
        </Link>
        <button type="button" className={styles.secondary} onClick={signOut} disabled={busy}>
          {busy ? "Виходимо…" : "Вийти"}
        </button>
      </div>
    </div>
  );
}
