"use client";

import { createContext, useContext, useEffect } from "react";
import { useHidden } from "./HiddenProvider";

const Context = createContext(false);

/** Чи ховати тут аніме, які вже є в списках людини (крім «Планую»). */
export function useSkipListed(): boolean {
  return useContext(Context);
}

/** Усередині — не показуємо аніме, які людина вже дивиться, переглянула, поставила на паузу чи кинула. */
export function SkipListed({ children }: { children: React.ReactNode }) {
  const { refreshListed } = useHidden();
  useEffect(() => {
    refreshListed();
  }, [refreshListed]);
  return <Context.Provider value={true}>{children}</Context.Provider>;
}
