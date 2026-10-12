"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PHONE_PATTERN, countryOptions, type Profile } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NicknameField, type NicknameState } from "./NicknameField";
import { notifyProfileChanged, useProfile } from "./useProfile";
import { useUser } from "./useUser";
import styles from "./auth.module.css";

/** Сторінка «Мій профіль»: нікнейм, ПІБ, телефон, країна; зміна пароля, вихід. */
export function AccountView() {
  const user = useUser();
  const { profile, reload } = useProfile();
  const router = useRouter();
  const welcome = useSearchParams().get("welcome") === "1";
  const [busy, setBusy] = useState(false);

  if (user === undefined || (user && profile === undefined)) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Мій профіль</h1>
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
    <div className={`${styles.card} ${styles.cardWide}`}>
      {welcome && <p className={styles.notice}>Ласкаво просимо до YourMovie! Акаунт створено.</p>}
      <div className={styles.profileHead}>
        <span className={styles.bigAvatar} aria-hidden="true">
          {(profile?.nickname ?? user.email ?? "?")[0].toUpperCase()}
        </span>
        <div>
          <h1 className={styles.title}>{profile?.nickname ?? "Мій профіль"}</h1>
          <p className={styles.hint}>
            {profile ? `Користувач №${profile.user_number} · ` : ""}з нами з {since}
          </p>
        </div>
      </div>

      {profile ? (
        <ProfileForm key={profile.id} profile={profile} email={user.email ?? ""} onSaved={reload} />
      ) : (
        <p className={styles.error}>Не вдалося завантажити профіль. Оновіть сторінку.</p>
      )}

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

function ProfileForm({ profile, email, onSaved }: { profile: Profile; email: string; onSaved: () => void }) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [nicknameState, setNicknameState] = useState<NicknameState>("same");
  const onNicknameState = useCallback((state: NicknameState) => setNicknameState(state), []);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const countries = useMemo(() => countryOptions(), []);

  const changed =
    nickname.trim() !== profile.nickname ||
    fullName.trim() !== (profile.full_name ?? "") ||
    phone.trim() !== (profile.phone ?? "") ||
    country !== (profile.country ?? "");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (nicknameState !== "free" && nicknameState !== "same") {
      setMessage({
        ok: false,
        text: nicknameState === "taken" ? "Цей нікнейм уже зайнятий." : "Перевірте нікнейм.",
      });
      return;
    }
    const cleanPhone = phone.trim();
    if (cleanPhone && !PHONE_PATTERN.test(cleanPhone)) {
      setMessage({ ok: false, text: "Телефон: лише цифри, пробіли, дужки, дефіс і «+» на початку." });
      return;
    }
    setSaving(true);
    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        nickname: nickname.trim(),
        full_name: fullName.trim() || null,
        phone: cleanPhone || null,
        country: country || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      console.error(error);
      setMessage({
        ok: false,
        text:
          error.code === "23505"
            ? "Цей нікнейм щойно зайняли — спробуйте інший."
            : error.code === "23514"
              ? "Деякі поля заповнено неправильно."
              : "Не вдалося зберегти. Спробуйте ще раз.",
      });
      return;
    }
    setMessage({ ok: true, text: "Збережено." });
    onSaved();
    notifyProfileChanged();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <NicknameField
        value={nickname}
        onChange={(v) => (setNickname(v), setMessage(null))}
        onStateChange={onNicknameState}
        current={profile.nickname}
      />

      <label className={styles.field}>
        <span>Пошта</span>
        <input type="email" value={email} readOnly className={`${styles.input} ${styles.readOnly}`} />
      </label>

      <p className={styles.sectionNote}>Ці дані необов’язкові й видні лише вам.</p>

      <label className={styles.field}>
        <span>Прізвище, ім’я, по батькові</span>
        <input
          type="text"
          autoComplete="name"
          maxLength={100}
          value={fullName}
          onChange={(e) => (setFullName(e.target.value), setMessage(null))}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>Телефон</span>
        <input
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="+380 67 123 45 67"
          value={phone}
          onChange={(e) => (setPhone(e.target.value), setMessage(null))}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>Країна</span>
        <select
          value={country}
          onChange={(e) => (setCountry(e.target.value), setMessage(null))}
          className={styles.input}
          autoComplete="country"
        >
          <option value="">Не вказано</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {message && (
        <p className={message.ok ? styles.success : styles.error} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={saving || !changed}>
        {saving ? "Зберігаємо…" : changed ? "Зберегти зміни" : "Змін немає"}
      </button>
    </form>
  );
}
