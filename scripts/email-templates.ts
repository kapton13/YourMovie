/**
 * Згенерувати шаблони листів для Supabase: `npm run email-templates` → supabase/email-templates/*.html.
 * Тексти — у словниках (`messages/<мова>/email.ts`). Як вставити — supabase/email-templates/README.md.
 */
import { writeFileSync } from "node:fs";
import { EMAIL_KINDS, emailTemplate, type EmailKind } from "../lib/emailTemplates";
import { messagesFor } from "../messages";

for (const kind of Object.keys(EMAIL_KINDS) as EmailKind[]) {
  const path = `supabase/email-templates/${EMAIL_KINDS[kind].file}`;
  writeFileSync(path, emailTemplate(kind, messagesFor));
  console.log(`${path} — тема: «${EMAIL_KINDS[kind].subject}»`);
}
