/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email = {
  footer: "YourMovie — your anime tracker",
  linkHint: "If the button doesn’t work, copy this link into your browser:",
  confirm: {
    heading: "Confirm your email",
    text: "Welcome to YourMovie! Press the button to confirm your email and finish signing up.",
    button: "Confirm email",
    ignore: "If you didn’t sign up for YourMovie, just ignore this email.",
  },
  recovery: {
    heading: "Reset your password",
    text: "Someone asked to reset the password for your YourMovie account. Press the button to set a new one. The link works on any device.",
    button: "Set a new password",
    ignore: "If it wasn’t you, ignore this email — your password stays the same.",
  },
};

export default email;
