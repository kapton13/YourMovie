import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMAIL_KINDS, emailTemplate, type EmailKind } from "@/lib/emailTemplates";
import { LOCALES } from "@/lib/i18n/config";
import { messagesFor } from "@/messages";

/** Шаблони листів для Supabase (supabase/email-templates): усі мови, посилання на будь-якому пристрої. */

const kinds = Object.keys(EMAIL_KINDS) as EmailKind[];

describe.each(kinds)("лист %s", (kind) => {
  const template = emailTemplate(kind, messagesFor);

  it("файл у supabase/email-templates оновлено (`npm run email-templates`)", () => {
    expect(readFileSync(`supabase/email-templates/${EMAIL_KINDS[kind].file}`, "utf8")).toBe(template);
  });

  it("гілка для кожної мови; невідома мова — англійська", () => {
    for (const lang of LOCALES.filter((l) => l !== "en")) expect(template).toContain(`eq $want \`${lang}\``);
    expect(template).toContain("{{ else }}");
  });

  it("посилання з одноразовим ключем на наш /auth/callback (працює на будь-якому пристрої)", () => {
    expect(template).toContain(`/auth/callback?token_hash={{ .TokenHash }}&type=${EMAIL_KINDS[kind].type}&next={{ $next }}`);
    expect(template).not.toContain("ConfirmationURL");
  });

  it("тексти не ламають шаблон (без зворотних лапок і фігурних дужок)", () => {
    for (const lang of LOCALES) {
      const m = messagesFor(lang).email;
      for (const text of [...Object.values(m[kind]), m.footer, m.linkHint]) expect(text, lang).not.toMatch(/[`{}]/);
    }
  });
});
