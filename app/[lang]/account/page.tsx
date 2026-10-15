import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/auth/AccountView";
import styles from "@/components/auth/auth.module.css";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.account.meta.title };
}

export default function AccountPage() {
  return (
    <div className={styles.wrap}>
      <Suspense fallback={<div className={styles.skeleton} />}>
        <AccountView />
      </Suspense>
    </div>
  );
}
