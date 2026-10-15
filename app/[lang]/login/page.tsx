import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import styles from "@/components/auth/auth.module.css";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.auth.meta.login };
}

export default function LoginPage() {
  return (
    <div className={styles.wrap}>
      <Suspense fallback={<div className={styles.skeleton} />}>
        <AuthForm initialMode="login" />
      </Suspense>
    </div>
  );
}
