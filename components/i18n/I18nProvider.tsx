"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { LOCALE_INFO, localePath, type Locale } from "@/lib/i18n/config";
import { count, fmt, plural, type Plural } from "@/lib/i18n/format";
import type { Messages } from "@/messages";

type I18n = {
  lang: Locale;
  /** Тексти поточної мови (чого бракує — англійською). */
  m: Messages;
  /** Код для Intl: дати й числа за правилами мови. */
  intl: string;
  fmt: typeof fmt;
  plural: (forms: Plural, n: number) => string;
  count: (forms: Plural, n: number) => string;
  /** Шлях сайту з мовою: href("/catalog") → "/uk/catalog". */
  href: (path: string) => string;
};

const Context = createContext<I18n | null>(null);

export function I18nProvider({ lang, messages, children }: { lang: Locale; messages: Messages; children: React.ReactNode }) {
  const value = useMemo<I18n>(() => {
    const intl = LOCALE_INFO[lang].intl;
    return {
      lang,
      m: messages,
      intl,
      fmt,
      plural: (forms, n) => plural(forms, n, intl),
      count: (forms, n) => count(forms, n, intl),
      href: (path) => localePath(lang, path),
    };
  }, [lang, messages]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n: немає I18nProvider");
  return value;
}

/** Посилання, що саме додає мову до шляхів сайту: <Link href="/catalog"> → /uk/catalog. */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { lang } = useI18n();
  return <NextLink href={typeof href === "string" ? localePath(lang, href) : href} {...props} />;
}

/** useRouter, що теж додає мову до шляхів. */
export function useLocaleRouter() {
  const router = useRouter();
  const { lang } = useI18n();
  return useMemo(
    () => ({
      ...router,
      push: (path: string, options?: Parameters<typeof router.push>[1]) => router.push(localePath(lang, path), options),
      replace: (path: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localePath(lang, path), options),
      prefetch: (path: string) => router.prefetch(localePath(lang, path)),
    }),
    [router, lang],
  );
}
