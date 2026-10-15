import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { ThemeToggle, themeInitScript } from "@/components/ThemeToggle";
import { MyAnimeLink, RecommendationsLink } from "@/components/auth/MyAnimeLink";
import { UserMenu } from "@/components/auth/UserMenu";
import { HiddenProvider } from "@/components/hidden/HiddenProvider";
import { I18nProvider, Link } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LOCALES, LOCALE_INFO } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import "../globals.css";

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.common.siteTitle, description: m.common.siteDescription };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { lang, m } = await getI18n();
  const [before, after] = m.common.footer.dataBy.split("{source}");
  return (
    <html lang={lang} dir={LOCALE_INFO[lang].dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <I18nProvider lang={lang} messages={m}>
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="logo">
                Your<span>Movie</span>
              </Link>
              <div className="header-actions">
                <nav className="nav">
                  <Link href="/" className="nav-home">
                    {m.common.nav.home}
                  </Link>
                  <Link href="/catalog" className="nav-catalog" aria-label={m.common.nav.catalog}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                    <span>{m.common.nav.catalog}</span>
                  </Link>
                  <MyAnimeLink />
                  <RecommendationsLink />
                </nav>
                <LanguageSwitcher />
                <ThemeToggle />
                <Suspense fallback={<span className="user-placeholder" aria-hidden="true" />}>
                  <UserMenu />
                </Suspense>
              </div>
            </div>
          </header>
          <HiddenProvider>
            <main className="container main">{children}</main>
          </HiddenProvider>
          <footer className="site-footer">
            <div className="container">
              {before}
              <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">
                AniList
              </a>
              {after}
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}

