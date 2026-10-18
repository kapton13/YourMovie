import { LOCALES, LOCALE_INFO, type Locale } from "./i18n/config";
import type { Messages } from "@/messages";

/**
 * Шаблони листів для Supabase (Authentication → Email Templates), усіма мовами сайту в одному шаблоні:
 * мова — з `user_metadata.language` (зберігається при реєстрації й зміні мови), інакше англійська.
 * Посилання — `token_hash` на наш `/auth/callback`: працює на будь-якому пристрої (на відміну від коду,
 * який прив'язаний до браузера, де просили лист).
 */

export type EmailKind = "confirm" | "recovery";

export const EMAIL_KINDS: Record<EmailKind, { file: string; type: string; next: (lang: Locale) => string; subject: string }> = {
  confirm: { file: "confirm-signup.html", type: "email", next: (lang) => `/${lang}/account?welcome=1`, subject: "YourMovie: confirm your email" },
  recovery: { file: "reset-password.html", type: "recovery", next: (lang) => `/${lang}/reset-password`, subject: "YourMovie: reset your password" },
};

/** Рядок для Go-шаблону: «сирі» лапки `…` (у текстах їх немає — перевіряє тест). */
const goString = (text: string) => `\`${text}\``;

const FIELDS = ["heading", "text", "button", "ignore"] as const;

/** Посилання з листа: Supabase підставить адресу сайту й одноразовий ключ; `next` — сторінка мовою людини. */
export function emailLink(kind: EmailKind): string {
  return `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=${EMAIL_KINDS[kind].type}&next={{ $next }}`;
}

/**
 * Один шаблон (Go-шаблони Supabase): спершу тексти мовою людини в змінних, потім одна розмітка листа.
 * Go сам екранує значення змінних (і кодує `next` у посиланні).
 */
export function emailTemplate(kind: EmailKind, messagesFor: (lang: Locale) => Messages): string {
  const vars = (lang: Locale) => {
    const m = messagesFor(lang);
    const t = m.email[kind];
    return [
      `{{ $lang = ${goString(lang)} }}{{ $dir = ${goString(LOCALE_INFO[lang].dir)} }}{{ $next = ${goString(EMAIL_KINDS[kind].next(lang))} }}`,
      ...FIELDS.map((f) => `{{ $${f} = ${goString(t[f])} }}`),
      `{{ $linkHint = ${goString(m.email.linkHint)} }}{{ $footer = ${goString(m.email.footer)} }}`,
    ].join("\n");
  };
  const declare = ["lang", "dir", "next", ...FIELDS, "linkHint", "footer"].map((v) => `{{ $${v} := "" }}`).join("");
  const others = LOCALES.filter((l) => l !== "en");
  const link = emailLink(kind);
  return `${declare}
{{ $want := printf "%v" .Data.language }}
${others.map((lang, i) => `{{ ${i === 0 ? "if" : "else if"} eq $want ${goString(lang)} }}\n${vars(lang)}`).join("\n")}
{{ else }}
${vars("en")}
{{ end }}
<!doctype html>
<html lang="{{ $lang }}" dir="{{ $dir }}">
<body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#161922;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;">
        <tr><td style="font-size:22px;font-weight:800;padding-bottom:24px;">Your<span style="color:#3d5fe0;">Movie</span></td></tr>
        <tr><td style="font-size:20px;font-weight:700;padding-bottom:12px;">{{ $heading }}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#2b2f3a;padding-bottom:24px;">{{ $text }}</td></tr>
        <tr><td style="padding-bottom:24px;">
          <a href="${link}" style="display:inline-block;background:#3d5fe0;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px;">{{ $button }}</a>
        </td></tr>
        <tr><td style="font-size:13px;line-height:1.5;color:#5d6475;padding-bottom:6px;">{{ $linkHint }}</td></tr>
        <tr><td style="font-size:12px;line-height:1.5;word-break:break-all;padding-bottom:24px;"><a href="${link}" style="color:#3d5fe0;">${link}</a></td></tr>
        <tr><td style="font-size:13px;line-height:1.5;color:#5d6475;border-top:1px solid #e6e8ef;padding-top:16px;">{{ $ignore }}</td></tr>
      </table>
      <p style="font-size:12px;color:#5d6475;margin:16px 0 0;">{{ $footer }}</p>
    </td></tr>
  </table>
</body>
</html>
`;
}
