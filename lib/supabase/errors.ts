/** Зрозумілі повідомлення замість технічних помилок Supabase. */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null): string {
  if (!error) return "";
  switch (error.code) {
    case "invalid_credentials":
      return "Неправильна пошта або пароль.";
    case "email_not_confirmed":
      return "Спершу підтвердьте пошту: ми надіслали вам лист із посиланням.";
    case "user_already_exists":
    case "email_exists":
      return "Акаунт із цією поштою вже існує. Спробуйте увійти.";
    case "weak_password":
      return "Пароль надто простий. Візьміть щонайменше 8 символів.";
    case "email_address_invalid":
    case "validation_failed":
      return "Перевірте, чи правильно введено пошту.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Забагато спроб. Зачекайте трохи й спробуйте знову.";
    case "same_password":
      return "Новий пароль має відрізнятися від старого.";
    case "signup_disabled":
      return "Реєстрацію тимчасово вимкнено.";
  }
  if (error.status === 429) return "Забагато спроб. Зачекайте трохи й спробуйте знову.";
  return "Щось пішло не так. Спробуйте ще раз трохи згодом.";
}
