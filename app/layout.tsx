import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "YourMovie — трекер аніме",
  description: "Каталог аніме, особисті списки та рекомендації.",
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              Your<span>Movie</span>
            </Link>
            <nav className="nav">
              <Link href="/">Головна</Link>
            </nav>
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
