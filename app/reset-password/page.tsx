import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import styles from "@/components/auth/auth.module.css";

export const metadata: Metadata = { title: "Новий пароль — YourMovie" };

export default function ResetPasswordPage() {
  return (
    <div className={styles.wrap}>
      <NewPasswordForm />
    </div>
  );
}
