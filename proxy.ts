import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LANG_COOKIE, hasLocale } from "@/lib/i18n/config";

/**
 * Адреса без мови (старі посилання, «/») → та сама з мовою: обраною раніше (cookie) або англійською.
 * Автовибору за мовою браузера немає (рішення власника).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasLocale(pathname.split("/")[1])) return;
  const saved = request.cookies.get(LANG_COOKIE)?.value;
  const lang = hasLocale(saved) ? saved : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Усе, крім службового: API, посилань із листів, файлів Next.js і статичних файлів (з крапкою в імені).
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
