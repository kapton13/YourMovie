"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Link, useI18n, useLocaleRouter } from "@/components/i18n/I18nProvider";
import { useSwitchLanguage } from "@/components/i18n/LanguageSwitcher";
import { LOCALES, LOCALE_INFO, hasLocale } from "@/lib/i18n/config";
import {
  NAME_MAX_LENGTH,
  PHONE_PATTERN,
  cleanName,
  cleanNickname,
  countryOptions,
  nameProblem,
  type Profile,
} from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NicknameField, type NicknameState } from "./NicknameField";
import { notifyProfileChanged, useProfile } from "./useProfile";
import { useUser } from "./useUser";
import styles from "./auth.module.css";

/** Сторінка «Мій профіль»: нікнейм, ПІБ, телефон, країна, мова сайту; зміна пароля, вихід. */
export function AccountView() {
  const user = useUser();
  const { profile, reload } = useProfile();
  const router = useLocaleRouter();
  const { m, fmt, intl } = useI18n();
  const t = m.account;
  const welcome = useSearchParams().get("welcome") === "1";
  const [busy, setBusy] = useState(false);

  if (user === undefined || (user && profile === undefined)) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.text}>{t.notLoggedIn}</p>
        <p className={styles.switch}>
          <Link href="/login">{t.login}</Link> {t.or} <Link href="/signup">{t.signup}</Link>
        </p>
      </div>
    );
  }

  const since = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric" }).format(
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
      {welcome && <p className={styles.notice}>{t.welcome}</p>}
      <div className={styles.profileHead}>
        <span className={styles.bigAvatar} aria-hidden="true">
          {(profile?.nickname ?? user.email ?? "?")[0].toUpperCase()}
        </span>
        <div>
          <h1 className={styles.title}>{profile?.nickname ?? t.title}</h1>
          <p className={styles.hint}>
            {profile ? `${fmt(t.userNumber, { n: profile.user_number })} · ` : ""}
            {fmt(t.since, { date: since })}
          </p>
        </div>
      </div>

      {profile && <PublicSwitch profile={profile} onSaved={reload} />}

      <LanguageSetting />

      {profile ? (
        <ProfileForm key={profile.id} profile={profile} email={user.email ?? ""} onSaved={reload} />
      ) : (
        <p className={styles.error}>{t.loadError}</p>
      )}

      <div className={styles.actions}>
        <Link href="/reset-password" className={styles.secondary}>
          {t.changePassword}
        </Link>
        <button type="button" className={styles.secondary} onClick={signOut} disabled={busy}>
          {busy ? t.signingOut : t.signOut}
        </button>
      </div>
    </div>
  );
}

/** «Відкритий профіль»: чи бачать інші мою статистику й списки (за замовчуванням — ні). */
function PublicSwitch({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const { m } = useI18n();
  const t = m.account.public;
  const [value, setValue] = useState(Boolean(profile.is_public));
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const link = `/u/${encodeURIComponent(profile.nickname)}`;

  async function toggle(next: boolean) {
    setValue(next);
    setSaving(true);
    setProblem("");
    const { error } = await getSupabaseBrowser().from("profiles").update({ is_public: next }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      console.error(error);
      setValue(!next);
      setProblem(
        error.code === "PGRST204" ? t.dbOutdated : m.account.errors.saveFailed,
      );
      return;
    }
    onSaved();
    notifyProfileChanged();
  }

  return (
    <div className={styles.publicBox}>
      <label className={styles.remember}>
        <input type="checkbox" checked={value} disabled={saving} onChange={(e) => toggle(e.target.checked)} />
        <span>
          {t.label}
          <span className={styles.hint}>{value ? t.on : t.off}</span>
        </span>
      </label>
      <Link href={link} className={styles.profileLink}>
        {t.link}
      </Link>
      {problem && (
        <p className={styles.error} role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}

/** Мова сайту: обрана тут діє на всіх пристроях (зберігається в профілі). За замовчуванням — англійська. */
function LanguageSetting() {
  const { lang, m } = useI18n();
  const switchLanguage = useSwitchLanguage();
  const [switching, setSwitching] = useState(false);
  const [problem, setProblem] = useState(false);

  async function choose(value: string) {
    if (!hasLocale(value) || value === lang) return;
    setSwitching(true);
    setProblem(false);
    const ok = await switchLanguage(value);
    setSwitching(false);
    if (!ok) setProblem(true);
  }

  return (
    <div className={styles.publicBox}>
      <label className={styles.field}>
        <span>{m.common.language.label}</span>
        <select value={lang} disabled={switching} onChange={(e) => choose(e.target.value)} className={styles.input}>
          {LOCALES.map((l) => (
            <option key={l} value={l} lang={l}>
              {LOCALE_INFO[l].name}
            </option>
          ))}
        </select>
        <span className={styles.hint}>{m.account.language.hint}</span>
      </label>
      {problem && (
        <p className={styles.error} role="alert">
          {m.common.saveError}
        </p>
      )}
    </div>
  );
}

function ProfileForm({ profile, email, onSaved }: { profile: Profile; email: string; onSaved: () => void }) {
  const { m, fmt, intl } = useI18n();
  const t = m.account.form;
  const errors = m.account.errors;
  const [nickname, setNickname] = useState(profile.nickname);
  const [nicknameState, setNicknameState] = useState<NicknameState>("same");
  const onNicknameState = useCallback((state: NicknameState) => setNicknameState(state), []);
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [middleName, setMiddleName] = useState(profile.middle_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const countries = useMemo(() => countryOptions(intl), [intl]);

  const changed =
    cleanNickname(nickname) !== profile.nickname ||
    lastName.trim() !== (profile.last_name ?? "") ||
    firstName.trim() !== (profile.first_name ?? "") ||
    middleName.trim() !== (profile.middle_name ?? "") ||
    phone.trim() !== (profile.phone ?? "") ||
    country !== (profile.country ?? "");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (nicknameState !== "free" && nicknameState !== "same") {
      setMessage({
        ok: false,
        text: nicknameState === "taken" ? errors.nicknameTaken : errors.checkNickname,
      });
      return;
    }
    const nameError = (
      [
        [lastName, t.lastName],
        [firstName, t.firstName],
        [middleName, t.middleName],
      ] as const
    )
      .map(([value, label]) => ({ problem: nameProblem(value), label }))
      .find((x) => x.problem);
    if (nameError) {
      setMessage({
        ok: false,
        text: fmt(nameError.problem === "long" ? errors.nameTooLong : errors.nameChars, {
          label: nameError.label,
          n: NAME_MAX_LENGTH,
        }),
      });
      return;
    }
    const cleanPhone = phone.trim();
    if (cleanPhone && !PHONE_PATTERN.test(cleanPhone)) {
      setMessage({ ok: false, text: errors.phone });
      return;
    }
    setSaving(true);
    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        nickname: cleanNickname(nickname),
        last_name: cleanName(lastName) || null,
        first_name: cleanName(firstName) || null,
        middle_name: cleanName(middleName) || null,
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
            ? errors.nicknameJustTaken
            : error.code === "23514"
              ? errors.invalidFields
              : error.code === "PGRST204"
                ? errors.dbOutdated
                : errors.saveFailed,
      });
      return;
    }
    setMessage({ ok: true, text: t.saved });
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
        <span>{t.email}</span>
        <input type="email" value={email} readOnly className={`${styles.input} ${styles.readOnly}`} />
      </label>

      <p className={styles.sectionNote}>{t.privateNote}</p>

      {(
        [
          [t.lastName, lastName, setLastName, "family-name"],
          [t.firstName, firstName, setFirstName, "given-name"],
          [t.middleName, middleName, setMiddleName, "additional-name"],
        ] as const
      ).map(([label, value, setValue, autoComplete]) => (
        <label key={label} className={styles.field}>
          <span>{label}</span>
          <input
            type="text"
            autoComplete={autoComplete}
            // Із запасом: рідкісні ієрогліфи браузер рахує за два знаки; точну довжину перевіряємо нижче.
            maxLength={NAME_MAX_LENGTH * 2}
            dir="auto"
            value={value}
            onChange={(e) => (setValue(e.target.value), setMessage(null))}
            className={styles.input}
          />
        </label>
      ))}

      <label className={styles.field}>
        <span>{t.phone}</span>
        <input
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          placeholder={t.phonePlaceholder}
          value={phone}
          onChange={(e) => (setPhone(e.target.value), setMessage(null))}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>{t.country}</span>
        <select
          value={country}
          onChange={(e) => (setCountry(e.target.value), setMessage(null))}
          className={styles.input}
          autoComplete="country"
        >
          <option value="">{t.noCountry}</option>
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
        {saving ? t.saving : changed ? t.save : t.noChanges}
      </button>
    </form>
  );
}
