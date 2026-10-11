"use client";

import { createContext, useContext, useTransition } from "react";
import styles from "./CatalogTransition.module.css";

type TransitionContext = {
  isPending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
};

const Context = createContext<TransitionContext | null>(null);

/**
 * Спільний «перехід» для каталогу: поки нові результати вантажаться,
 * старі лишаються на місці, але приглушені.
 */
export function CatalogTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return <Context.Provider value={{ isPending, startTransition }}>{children}</Context.Provider>;
}

export function useCatalogTransition(): TransitionContext {
  const context = useContext(Context);
  if (!context) throw new Error("useCatalogTransition: немає CatalogTransitionProvider");
  return context;
}

export function PendingResults({ children }: { children: React.ReactNode }) {
  const { isPending } = useCatalogTransition();
  return (
    <div className={`${styles.results} ${isPending ? styles.pending : ""}`} aria-busy={isPending}>
      {isPending && <div className={styles.bar} role="progressbar" aria-label="Шукаємо…" />}
      {children}
    </div>
  );
}
