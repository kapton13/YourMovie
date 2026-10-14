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

/** «Рекомендації» в шапці — лише для тих, хто ввійшов. На телефоні — значок. */
export function RecommendationsLink() {
  const user = useUser();
  if (!user) return null;
  return (
    <Link href="/recommendations" className="nav-my" aria-label="Рекомендації">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
        <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </svg>
      <span>Рекомендації</span>
    </Link>
  );
}
