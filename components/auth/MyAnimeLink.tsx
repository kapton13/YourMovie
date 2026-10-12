"use client";

import Link from "next/link";
import { useUser } from "./useUser";

/** «Мої аніме» в шапці — лише для тих, хто ввійшов. На телефоні — значок. */
export function MyAnimeLink() {
  const user = useUser();
  if (!user) return null;
  return (
    <Link href="/my" className="nav-my" aria-label="Мої аніме">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
      <span>Мої аніме</span>
    </Link>
  );
}
