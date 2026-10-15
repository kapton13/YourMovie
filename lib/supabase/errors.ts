import type { Messages } from "@/messages";

/** Зрозумілі повідомлення замість технічних помилок Supabase (мовою сайту: `m` — тексти з useI18n). */
export function authErrorMessage(
  error: { code?: string; message?: string; status?: number } | null,
  m: Messages,
): string {
  if (!error) return "";
  const t = m.auth.errors;
  switch (error.code) {
    case "invalid_credentials":
      return t.invalidCredentials;
    case "email_not_confirmed":
      return t.emailNotConfirmed;
    case "user_already_exists":
    case "email_exists":
      return t.userExists;
    case "weak_password":
      return t.weakPassword;
    case "email_address_invalid":
    case "validation_failed":
      return t.invalidEmail;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return t.rateLimit;
    case "same_password":
      return t.samePassword;
    case "signup_disabled":
      return t.signupDisabled;
  }
  if (error.status === 429) return t.rateLimit;
  return t.unknown;
}
