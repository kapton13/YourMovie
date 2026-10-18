import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — 你的追番记录",
  linkHint: "如果按钮无法使用，请将此链接复制到浏览器中：",
  confirm: {
    heading: "验证你的邮箱",
    text: "欢迎来到 YourMovie！点击按钮验证邮箱，完成注册。",
    button: "验证邮箱",
    ignore: "如果你没有注册 YourMovie，请忽略这封邮件。",
  },
  recovery: {
    heading: "重置密码",
    text: "有人请求重置你的 YourMovie 账号密码。点击按钮设置新密码。链接在任何设备上都可以使用。",
    button: "设置新密码",
    ignore: "如果不是你本人操作，请忽略这封邮件，你的密码不会改变。",
  },
};

export default email;
