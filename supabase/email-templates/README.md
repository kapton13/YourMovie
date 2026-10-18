# Листи YourMovie (шаблони для Supabase)

Файли тут генерує `npm run email-templates` з текстів у `messages/<мова>/email.ts` — **руками не правити**.
Кожен лист — одразу всіма 12 мовами (мова людини береться з її профілю; невідома — англійська).
Посилання в листах працюють на **будь-якому пристрої** (просили з комп'ютера — відкрили на телефоні).

## Як вставити (≈5 хв, безкоштовно)
1. Supabase → ваш проєкт → **Authentication → URL Configuration** → **Site URL** має бути адресою сайту:
   `https://your-movie-five.vercel.app` (після купівлі домену — новою адресою).
2. **Authentication → Emails → Templates**:
   - **Confirm signup**: Subject — `YourMovie: confirm your email`; у Body (вкладка Source) — увесь вміст
     `confirm-signup.html` замість того, що там є → **Save**.
   - **Reset password**: Subject — `YourMovie: reset your password`; Body — увесь вміст `reset-password.html` → **Save**.
3. Перевірка: на сайті «Забули пароль?» зі своєю поштою (вбудована пошта Supabase надсилає лише учасникам
   проєкту) → лист вашою мовою → кнопка відкриває сторінку нового пароля.

## Перед запуском (платне — на останній момент)
Вбудована пошта Supabase не надсилає листи стороннім людям. Перед запуском: свій домен → resend.com
(безкоштовно до 3000 листів на місяць) → у Supabase **Authentication → Emails → SMTP Settings** вставити дані
Resend (ключ — лише туди, нікому не надсилати). Шаблони лишаються ці самі.
