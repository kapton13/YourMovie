import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — twój tracker anime",
  linkHint: "Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:",
  confirm: {
    heading: "Potwierdź e-mail",
    text: "Witaj w YourMovie! Kliknij przycisk, aby potwierdzić e-mail i dokończyć rejestrację.",
    button: "Potwierdź e-mail",
    ignore: "Jeśli nie zakładałeś konta w YourMovie, po prostu zignoruj tę wiadomość.",
  },
  recovery: {
    heading: "Ustaw nowe hasło",
    text: "Ktoś poprosił o zresetowanie hasła do twojego konta YourMovie. Kliknij przycisk, aby ustawić nowe. Link działa na każdym urządzeniu.",
    button: "Ustaw nowe hasło",
    ignore: "Jeśli to nie ty, zignoruj tę wiadomość — hasło się nie zmieni.",
  },
};

export default email;
