import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LOCALE_INFO, hasLocale, languageRedirect } from "@/lib/i18n/config";
import { LIMITS, clientKey } from "@/lib/rateLimit";
import { messagesFor } from "@/messages";

/**
 * 1) Мова сторінки — ще до показу (`languageRedirect`): адреса без мови → обраною (cookie) або англійською;
 *    адреса іншою мовою, ніж обрала людина (кнопка «Назад», старе посилання, закладка), → обраною.
 *    Автовибору за мовою браузера немає (рішення власника).
 * 2) Захист від зловживань: пошук і фільтри каталогу (кожен новий запит іде в AniList) — не частіше
 *    за межу на адресу (`LIMITS.search`). Попередні завантаження посилань браузером не рахуються.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = languageRedirect(pathname, request.cookies.get(LANG_COOKIE)?.value);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  const lang = pathname.split("/")[1];
  if (search && /^\/[^/]+\/catalog$/.test(pathname) && hasLocale(lang) && !request.headers.get("next-router-prefetch")) {
    const limit = LIMITS.search.take(clientKey(request.headers));
    if (!limit.ok) {
      const { title, text } = messagesFor(lang).common.tooMany;
      return new NextResponse(
        `<!doctype html><html lang="${lang}" dir="${LOCALE_INFO[lang].dir}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
          `<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px;line-height:1.6"><h1>${title}</h1><p>${text}</p></body></html>`,
        { status: 429, headers: { "content-type": "text/html; charset=utf-8", "retry-after": String(limit.retryAfter) } },
      );
    }
  }
}

export const config = {
  // Усе, крім службового: API, посилань із листів, файлів Next.js і статичних файлів (з крапкою в імені).
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
