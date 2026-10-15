import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import styles from "@/components/auth/auth.module.css";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.auth.meta.resetPassword };
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.wrap}>
      <NewPasswordForm />
    </div>
  );
}
