"use client";

import { Link, useI18n } from "@/components/i18n/I18nProvider";
import { useNewEpisodes } from "@/components/my/useNewEpisodes";
import { useUser } from "./useUser";

/**
 * «Мої аніме» в шапці — лише для тих, хто ввійшов. На телефоні — значок.
 * Кружечок з числом — у скількох аніме вийшли нові серії (як «Нова серія!» на сторінці).
 */
export function MyAnimeLink() {
  const user = useUser();
  const fresh = useNewEpisodes();
  const { m, count } = useI18n();
  if (!user) return null;
  const label = fresh ? `${m.common.nav.myAnime} — ${count(m.common.nav.newEpisodes, fresh)}` : m.common.nav.myAnime;
  return (
    <Link href="/my" className="nav-my" aria-label={label} title={fresh ? label : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
      <span>{m.common.nav.myAnime}</span>
      {fresh ? (
        <b className="nav-badge" aria-hidden="true">
          {fresh > 99 ? "99+" : fresh}
        </b>
      ) : null}
    </Link>
  );
}

/** «Рекомендації» в шапці — лише для тих, хто ввійшов. На телефоні — значок. */
export function RecommendationsLink() {
  const user = useUser();
  const { m } = useI18n();
  if (!user) return null;
  return (
    <Link href="/recommendations" className="nav-my" aria-label={m.common.nav.recommendations}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
        <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </svg>
      <span>{m.common.nav.recommendations}</span>
    </Link>
  );
}
