import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie – dein Anime-Tracker",
  linkHint: "Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
  confirm: {
    heading: "Bestätige deine E-Mail",
    text: "Willkommen bei YourMovie! Tippe auf den Button, um deine E-Mail zu bestätigen und die Registrierung abzuschließen.",
    button: "E-Mail bestätigen",
    ignore: "Wenn du dich nicht bei YourMovie registriert hast, ignoriere diese E-Mail einfach.",
  },
  recovery: {
    heading: "Passwort zurücksetzen",
    text: "Jemand möchte das Passwort für dein YourMovie-Konto zurücksetzen. Tippe auf den Button, um ein neues festzulegen. Der Link funktioniert auf jedem Gerät.",
    button: "Neues Passwort festlegen",
    ignore: "Warst du das nicht, ignoriere diese E-Mail – dein Passwort bleibt unverändert.",
  },
};

export default email;
