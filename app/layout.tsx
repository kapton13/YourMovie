import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ThemeToggle, themeInitScript } from "@/components/ThemeToggle";
import { MyAnimeLink } from "@/components/auth/MyAnimeLink";
import { UserMenu } from "@/components/auth/UserMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "YourMovie — трекер аніме",
  description: "Каталог аніме, особисті списки та рекомендації.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              Your<span>Movie</span>
            </Link>
            <div className="header-actions">
              <nav className="nav">
                <Link href="/" className="nav-home">
                  Головна
                </Link>
                <Link href="/catalog">Каталог</Link>
                <MyAnimeLink />
              </nav>
              <ThemeToggle />
              <Suspense fallback={<span className="user-placeholder" aria-hidden="true" />}>
                <UserMenu />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="container main">{children}</main>
        <footer className="site-footer">
          <div className="container">
            Дані про аніме надає{" "}
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">
              AniList
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
