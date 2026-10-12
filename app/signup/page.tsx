import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import styles from "@/components/auth/auth.module.css";

export const metadata: Metadata = { title: "Реєстрація — YourMovie" };

export default function SignupPage() {
  return (
    <div className={styles.wrap}>
      <Suspense fallback={<div className={styles.skeleton} />}>
        <AuthForm initialMode="signup" />
      </Suspense>
    </div>
  );
}
