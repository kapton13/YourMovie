"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useHidden } from "./HiddenProvider";

/** «Знайдено N аніме» без тих, що сховані як «Не цікаво». */
export function VisibleCount({ ids, className }: { ids: number[]; className?: string }) {
  const { hiddenIds } = useHidden();
  const { m, count } = useI18n();
  const visible = ids.filter((id) => !hiddenIds.has(id)).length;
  return <p className={className}>{count(m.catalog.results.found, visible)}</p>;
}
