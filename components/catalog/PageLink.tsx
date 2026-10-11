"use client";

import { useRouter } from "next/navigation";
import { useCatalogTransition } from "./CatalogTransition";

/** Посилання на іншу сторінку результатів: старі результати приглушуються, поки вантажаться нові. */
export function PageLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const { startTransition } = useCatalogTransition();
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        startTransition(() => router.push(href));
      }}
    >
      {children}
    </a>
  );
}
