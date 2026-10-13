"use client";

import { useHidden } from "./HiddenProvider";

/** «Знайдено N аніме» без тих, що сховані як «Не цікаво». */
export function VisibleCount({ ids, className }: { ids: number[]; className?: string }) {
  const { hiddenIds } = useHidden();
  const visible = ids.filter((id) => !hiddenIds.has(id)).length;
  return <p className={className}>Знайдено {visible.toLocaleString("uk-UA")} аніме</p>;
}
