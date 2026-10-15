/**
 * «Не цікаво» без React: які картки ховати й які рядки зберегти в `hidden_media`.
 * Правило (власник, 2026-10-15): хрестик на будь-якій частині ховає все аніме — усі сезони,
 * фільми, OVA й спешли — скрізь (головна, каталог, пошук, схожі, рекомендації).
 */

export type HiddenRow = { media_id: number; franchise_key: number };

type FranchiseParts = { key: number; main: { id: number }[]; extras: { id: number }[] };

/** Усі частини аніме одним записом під ключем аніме (першою основною частиною). */
export function franchiseRows(franchise: FranchiseParts, extraIds: number[] = []): HiddenRow[] {
  const ids = new Set([...franchise.main, ...franchise.extras].map((p) => p.id));
  for (const id of extraIds) ids.add(id);
  return [...ids].map((id) => ({ media_id: id, franchise_key: franchise.key }));
}

/** Що зберегти одразу після хрестика, поки AniList ще не віддав усі частини: саму частину й першу частину аніме. */
export function quickRows(mediaId: number, rootId?: number): HiddenRow[] {
  const root = rootId ?? mediaId;
  return [...new Set([mediaId, root])].map((id) => ({ media_id: id, franchise_key: root }));
}

/**
 * Доповнити сховане: для кожного аніме (ключ → збережені id), про яке AniList уже відповів, — рядки, яких бракує
 * (частково сховане, нові сезони) або які треба перенести під справжній ключ аніме. Порожньо — усе гаразд.
 */
export function rowsToComplete(groups: Map<number, number[]>, franchises: Record<number, FranchiseParts>): HiddenRow[] {
  const fixes: HiddenRow[] = [];
  for (const [key, have] of groups) {
    const franchise = franchises[key];
    if (!franchise) continue;
    const rows = franchiseRows(franchise, have);
    if (franchise.key !== key || rows.length !== have.length) fixes.push(...rows);
  }
  return fixes;
}

/**
 * Чи ховати картку. Сховано саму частину, перше аніме (`rootId`) або попередню частину (`parentId` — новий сезон
 * чи спешл сховано разом з аніме). `listedIds` — лише там, де ховаємо аніме, які вже в списках (головна, схожі).
 */
export function isCardHidden(
  card: { mediaId: number; rootId?: number; parentId?: number },
  hiddenIds: Set<number>,
  listedIds?: Set<number>,
): boolean {
  const ids = card.rootId && card.rootId !== card.mediaId ? [card.mediaId, card.rootId] : [card.mediaId];
  if (ids.some((id) => hiddenIds.has(id) || listedIds?.has(id))) return true;
  return card.parentId !== undefined && hiddenIds.has(card.parentId);
}
