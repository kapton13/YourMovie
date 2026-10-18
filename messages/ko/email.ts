import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — 나만의 애니 트래커",
  linkHint: "버튼이 작동하지 않으면 이 링크를 브라우저에 붙여 넣으세요:",
  confirm: {
    heading: "이메일을 인증해 주세요",
    text: "YourMovie에 오신 것을 환영해요! 버튼을 눌러 이메일을 인증하고 가입을 마무리하세요.",
    button: "이메일 인증",
    ignore: "YourMovie에 가입한 적이 없다면 이 메일을 무시하세요.",
  },
  recovery: {
    heading: "비밀번호 재설정",
    text: "YourMovie 계정의 비밀번호 재설정 요청이 있었어요. 버튼을 눌러 새 비밀번호를 설정하세요. 링크는 어떤 기기에서든 작동해요.",
    button: "새 비밀번호 설정",
    ignore: "본인이 요청하지 않았다면 이 메일을 무시하세요. 비밀번호는 그대로 유지돼요.",
  },
};

export default email;
