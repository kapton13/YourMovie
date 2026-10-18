import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — tu registro de anime",
  linkHint: "Si el botón no funciona, copia este enlace en tu navegador:",
  confirm: {
    heading: "Confirma tu correo",
    text: "¡Te damos la bienvenida a YourMovie! Pulsa el botón para confirmar tu correo y terminar el registro.",
    button: "Confirmar correo",
    ignore: "Si no te registraste en YourMovie, ignora este correo.",
  },
  recovery: {
    heading: "Restablece tu contraseña",
    text: "Alguien pidió restablecer la contraseña de tu cuenta de YourMovie. Pulsa el botón para crear una nueva. El enlace funciona en cualquier dispositivo.",
    button: "Crear nueva contraseña",
    ignore: "Si no fuiste tú, ignora este correo: tu contraseña no cambiará.",
  },
};

export default email;
