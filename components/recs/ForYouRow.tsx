"use client";

import { MediaRow } from "@/components/MediaRow";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useReasonText, useRecommendations } from "./useRecommendations";
import styles from "./Recommendations.module.css";

/** Ряд «Для вас» на головній — для тих, хто ввійшов і вже має аніме у списках. */
export function ForYouRow() {
  const state = useRecommendations();
  const { m } = useI18n();
  const reasonText = useReasonText();
  if (state.kind === "checking" || state.kind === "guest" || state.kind === "error") return null;
  if (state.kind === "loading") return <div className={styles.rowSkeleton} aria-hidden="true" />;
  const { items, basedOn } = state.result;
  if (basedOn === 0 || items.length === 0) return null;
  const reasons = new Map(items.map((i) => [i.media.id, reasonText(i.reason)]));
  return (
    <MediaRow
      title={m.recs.forYou}
      href="/recommendations"
      items={items.slice(0, 24).map((i) => i.media)}
      note={(media) => reasons.get(media.id)}
      limit={12}
    />
  );
}
