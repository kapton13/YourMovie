import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — votre suivi d’animes",
  linkHint: "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :",
  confirm: {
    heading: "Confirmez votre e-mail",
    text: "Bienvenue sur YourMovie ! Appuyez sur le bouton pour confirmer votre e-mail et terminer l’inscription.",
    button: "Confirmer l’e-mail",
    ignore: "Si vous ne vous êtes pas inscrit sur YourMovie, ignorez simplement cet e-mail.",
  },
  recovery: {
    heading: "Réinitialisez votre mot de passe",
    text: "Quelqu’un a demandé à réinitialiser le mot de passe de votre compte YourMovie. Appuyez sur le bouton pour en choisir un nouveau. Le lien fonctionne sur n’importe quel appareil.",
    button: "Choisir un nouveau mot de passe",
    ignore: "Si ce n’était pas vous, ignorez cet e-mail : votre mot de passe reste inchangé.",
  },
};

export default email;
