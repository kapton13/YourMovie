import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/auth/AccountView";
import styles from "@/components/auth/auth.module.css";

export const metadata: Metadata = { title: "Мій профіль — YourMovie" };

export default function AccountPage() {
  return (
    <div className={styles.wrap}>
      <Suspense fallback={<div className={styles.skeleton} />}>
        <AccountView />
      </Suspense>
    </div>
  );
}
