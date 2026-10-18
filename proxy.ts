import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, languageRedirect } from "@/lib/i18n/config";

/**
 * Мова сторінки — ще до показу (`languageRedirect`): адреса без мови → обраною (cookie) або англійською;
 * адреса іншою мовою, ніж обрала людина (кнопка «Назад», старе посилання, закладка), → обраною.
 * Автовибору за мовою браузера немає (рішення власника).
 */
export function proxy(request: NextRequest) {
  const target = languageRedirect(request.nextUrl.pathname, request.cookies.get(LANG_COOKIE)?.value);
  if (!target) return;
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  // Усе, крім службового: API, посилань із листів, файлів Next.js і статичних файлів (з крапкою в імені).
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
