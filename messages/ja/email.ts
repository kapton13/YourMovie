import type { Messages } from "..";

/** Листи (шаблони для Supabase генерує `npm run email-templates`). */
const email: Messages["email"] = {
  footer: "YourMovie — あなたのアニメ記録",
  linkHint: "ボタンが使えない場合は、このリンクをブラウザに貼り付けてください：",
  confirm: {
    heading: "メールアドレスの確認",
    text: "YourMovieへようこそ！ボタンを押してメールアドレスを確認し、登録を完了してください。",
    button: "メールアドレスを確認",
    ignore: "YourMovieに登録した覚えがない場合は、このメールを無視してください。",
  },
  recovery: {
    heading: "パスワードの再設定",
    text: "YourMovieアカウントのパスワード再設定のリクエストがありました。ボタンを押して新しいパスワードを設定してください。リンクはどの端末でも使えます。",
    button: "新しいパスワードを設定",
    ignore: "お心当たりがない場合は、このメールを無視してください。パスワードは変わりません。",
  },
};

export default email;
