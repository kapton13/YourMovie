import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — anime takipçin",
  linkHint: "Düğme çalışmazsa bu bağlantıyı tarayıcına kopyala:",
  confirm: {
    heading: "E-postanı onayla",
    text: "YourMovie’ye hoş geldin! E-postanı onaylayıp kaydı tamamlamak için düğmeye bas.",
    button: "E-postayı onayla",
    ignore: "YourMovie’ye kaydolmadıysan bu e-postayı yok say.",
  },
  recovery: {
    heading: "Şifreni sıfırla",
    text: "YourMovie hesabının şifresini sıfırlama isteği geldi. Yeni bir şifre belirlemek için düğmeye bas. Bağlantı her cihazda çalışır.",
    button: "Yeni şifre belirle",
    ignore: "Bu sen değilsen bu e-postayı yok say; şifren değişmez.",
  },
};

export default email;
