import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — seu rastreador de animes",
  linkHint: "Se o botão não funcionar, copie este link no seu navegador:",
  confirm: {
    heading: "Confirme seu e-mail",
    text: "Boas-vindas ao YourMovie! Toque no botão para confirmar seu e-mail e concluir o cadastro.",
    button: "Confirmar e-mail",
    ignore: "Se você não se cadastrou no YourMovie, ignore este e-mail.",
  },
  recovery: {
    heading: "Redefina sua senha",
    text: "Alguém pediu para redefinir a senha da sua conta do YourMovie. Toque no botão para criar uma nova. O link funciona em qualquer dispositivo.",
    button: "Criar nova senha",
    ignore: "Se não foi você, ignore este e-mail — sua senha continua a mesma.",
  },
};

export default email;
